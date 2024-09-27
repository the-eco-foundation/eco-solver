import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { JobsOptions, Queue } from 'bullmq'
import { QUEUES } from '../common/redis/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { getIntentJobId } from '../common/utils/strings'
import { SourceIntent } from '../eco-configs/eco-config.types'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { MultichainPublicClientService } from '../transaction/multichain-public-client.service'
import { IntentSourceAbi } from '../contracts'
import { WatchContractEventReturnType, zeroHash } from 'viem'
import { ViemEventLog } from '../common/events/websocket'
import { convertBigIntsToStrings } from '../common/viem/utils'

/**
 * Service class for solving an intent on chain. When this service starts up,
 * it creates websockets for all the supported prover contracts and listens for
 * events on them. When a new event is detected, it will publish that event to the
 * eventbus.
 */
@Injectable()
export class WebsocketIntentService implements OnApplicationBootstrap, OnModuleDestroy {
  private logger = new Logger(WebsocketIntentService.name)
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
    await this.subscribeWS()
  }

  async onModuleDestroy() {
    // close all websockets
    Object.values(this.unwatch).forEach((unwatch) => unwatch())
  }

  async subscribeWS() {
    const websocketTasks = this.ecoConfigService.getSourceIntents().map(async (source) => {
      const client = await this.publicClientService.getClient(source.chainID)
      this.unwatch[source.chainID] = client.watchContractEvent({
        onError: (error) => {
          this.logger.error(
            EcoLogMessage.fromDefault({
              message: `websocket error`,
              properties: {
                error,
              },
            }),
          )
        },
        address: source.sourceAddress,
        abi: IntentSourceAbi,
        eventName: 'IntentCreated',
        // restrict by acceptable provers
        args: { _prover: source.provers },
        onLogs: this.addJob(source),
      })
    })

    await Promise.all(websocketTasks)
  }

  addJob(source: SourceIntent) {
    return async (logs: ViemEventLog[]) => {
      for (const log of logs) {
        // bigint as it can't serialize to JSON
        const createIntent = convertBigIntsToStrings(log)
        createIntent.sourceChainID = source.chainID
        createIntent.sourceNetwork = source.network
        const jobId = getIntentJobId(
          'websocket',
          createIntent.transactionHash ?? zeroHash,
          createIntent.logIndex ?? 0,
        )
        this.logger.debug(
          EcoLogMessage.fromDefault({
            message: `websocket intent`,
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
