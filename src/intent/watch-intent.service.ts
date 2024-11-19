import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { JobsOptions, Queue } from 'bullmq'
import { QUEUES } from '../common/redis/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { getIntentJobId } from '../common/utils/strings'
import { IntentSource } from '../eco-configs/eco-config.types'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { MultichainPublicClientService } from '../transaction/multichain-public-client.service'
import { IntentCreatedLog } from '../contracts'
import { WatchContractEventReturnType, zeroHash } from 'viem'
import { convertBigIntsToStrings } from '../common/viem/utils'
import { entries } from 'lodash'
import { IntentSourceAbi } from '@eco-foundation/routes'

/**
 * This service subscribes to IntentSource contracts for IntentCreated events. It subscribes on all
 * supported chains and prover addresses. When an event is emitted, it mutates the event log, and then
 * adds it intent queue for processing.
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
    this.unsubscribe()
  }

  /**
   * Subscribes to all IntentSource contracts for IntentCreated events. It subscribes on all supported chains
   * filtering on the prover addresses and destination chain ids. It loads a mapping of the unsubscribe events to
   * call {@link onModuleDestroy} to close the clients.
   */
  async subscribe() {
    const solverSupportedChains = entries(this.ecoConfigService.getSolvers()).map(([, solver]) =>
      BigInt(solver.chainID),
    )
    const subscribeTasks = this.ecoConfigService.getIntentSources().map(async (source) => {
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
          _prover: source.provers,
        },
        onLogs: this.addJob(source),
      })
    })

    await Promise.all(subscribeTasks)
  }

  /**
   * Unsubscribes from all IntentSource contracts. It closes all clients in {@link onModuleDestroy}
   */
  async unsubscribe() {
    Object.values(this.unwatch).forEach((unwatch) => unwatch())
  }

  addJob(source: IntentSource) {
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
