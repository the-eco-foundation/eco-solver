import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { JobsOptions, Queue } from 'bullmq'
import { QUEUES } from '../common/redis/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { getIntentJobId } from '../common/utils/strings'
import { SourceIntent } from '../eco-configs/eco-config.types'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { MultichainPublicClientService } from '../transaction/multichain-public-client.service'
import { IntentCreatedLog, IntentSourceAbi } from '../contracts'
import { WatchContractEventReturnType, zeroHash } from 'viem'
import { convertBigIntsToStrings } from '../common/viem/utils'
import { entries } from 'lodash'

/**
 * Service class for solving an intent on chain. When this service starts up,
 * it creates a listener for all the supported prover contracts and listens for
 * events on them. When a new event is detected, it will publish that event to the
 * eventbus.
 */
@Injectable()
export class WatchIntentService implements OnApplicationBootstrap, OnModuleDestroy {
  private logger = new Logger(WatchIntentService.name)
  private intentJobConfig: JobsOptions
  private unwatch: Record<string, WatchContractEventReturnType> = {}

  constructor(
    @InjectQueue(QUEUES.SOURCE_INTENT.queue) private readonly intentQueue: Queue,
    private readonly publicClientService: MultichainPublicClientService,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  async onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig
  }

  async onApplicationBootstrap() {
    await this.subscribe()
  }

  async onModuleDestroy() {
    // close all clients
    Object.values(this.unwatch).forEach((unwatch) => unwatch())
  }

  async subscribe() {
    const solverSupportedChains = entries(this.ecoConfigService.getSolvers()).map(([chainID]) =>
      BigInt(chainID),
    )
    const subscribeTasks = this.ecoConfigService.getSourceIntents().map(async (source) => {
      const client = await this.publicClientService.getClient(source.chainID)
      this.unwatch[source.chainID] = client.watchContractEvent({
        onError: (error) => {
          this.logger.error(
            EcoLogMessage.fromDefault({
              message: `rpc client error`,
              properties: {
                error,
              },
            }),
          )
        },
        address: source.sourceAddress,
        abi: IntentSourceAbi,
        eventName: 'IntentCreated',
        args: {
          // restrict by acceptable chains, chain ids must be bigints
          _destinationChain: solverSupportedChains,
        },
        onLogs: this.addJob(source),
      })
    })

    await Promise.all(subscribeTasks)
  }

  addJob(source: SourceIntent) {
    return async (logs: IntentCreatedLog[]) => {
      for (const log of logs) {
        // bigint as it can't serialize to JSON
        const createIntent = convertBigIntsToStrings(log)
        createIntent.sourceChainID = source.chainID
        createIntent.sourceNetwork = source.network
        const jobId = getIntentJobId(
          'watch',
          createIntent.args._hash ?? zeroHash,
          createIntent.logIndex ?? 0,
        )
        this.logger.debug(
          EcoLogMessage.fromDefault({
            message: `watch intent`,
            properties: {
              createIntent,
              jobId,
            },
          }),
        )
        // add to processing queue
        await this.intentQueue.add(QUEUES.SOURCE_INTENT.jobs.create_intent, createIntent, {
          jobId,
          ...this.intentJobConfig,
        })
      }
    }
  }
}
