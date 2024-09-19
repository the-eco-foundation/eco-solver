import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { JobsOptions, Queue } from 'bullmq'
import { QUEUES } from '../common/redis/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { getIntentJobId } from '../common/utils/strings'
import { SourceIntent } from '../eco-configs/eco-config.types'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { MultichainPublicClientService } from '../alchemy/multichain-public-client.service'
import { IntentSourceAbi } from '../contracts'
import { WatchContractEventReturnType } from 'viem'
import { ViemEventLog } from '../common/events/websocket'
import { convertBigIntsToStrings } from '../viem/utils'

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
    const websocketTasks = this.ecoConfigService.getSourceIntents().map(async (source) => {
      const client = await this.publicClientService.getClient(source.chainID)
      this.unwatch[source.chainID] = client.watchContractEvent({
        address: source.sourceAddress,
        abi: IntentSourceAbi,
        eventName: 'IntentCreated',
        // todo restrict by acceptable provers
        args: { prover: source.provers },
        onLogs: this.addJob(source),
      })
    })

    await Promise.all(websocketTasks)
  }

  async onModuleDestroy() {
    // close all websockets
    Object.values(this.unwatch).forEach((unwatch) => unwatch())
  }

  addJob(source: SourceIntent) {
    return async (logs: ViemEventLog[]) => {
      const logTasks = logs.map((createIntent) => {
        //bigint as it cant serialize to json
        createIntent = convertBigIntsToStrings(createIntent)
        createIntent.sourceChainID = source.chainID
        this.logger.debug(
          EcoLogMessage.fromDefault({
            message: `websocket intent`,
            properties: {
              createIntent: createIntent,
            },
          }),
        )
        //add to processing queue
        return this.intentQueue.add(QUEUES.SOURCE_INTENT.jobs.create_intent, createIntent, {
          jobId: getIntentJobId('websocket', createIntent.transactionHash, createIntent.logIndex),
          ...this.intentJobConfig,
        })
      })
      await Promise.all(logTasks)
    }
  }
}
