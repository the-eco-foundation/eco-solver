import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { getCreateIntentLogFilter } from '../common/utils/ws.helpers'
import { AlchemyEventType, Network } from 'alchemy-sdk'
import { JobsOptions, Queue } from 'bullmq'
import { QUEUES } from '../common/redis/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { EventLogWS } from '../common/events/websocket'
import { getIntentJobId } from '../common/utils/strings'

/**
 * Service class for solving an intent on chain. When this service starts up,
 * it creates websockets for all the supported prover contracts and listens for
 * events on them. When a new event is detected, it will publish that event to the
 * eventbus.
 */
@Injectable()
export class WebsocketIntentService implements OnModuleInit {
  private logger = new Logger(WebsocketIntentService.name)
  private intentJobConfig: JobsOptions

  constructor(
    @InjectQueue(QUEUES.SOURCE_INTENT.queue) private readonly intentQueue: Queue,
    private readonly alchemyService: AlchemyService,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig
    this.ecoConfigService.getSourceIntents().forEach((source) => {
      this.alchemyService
        .getAlchemy(source.network)
        .ws.on(
          getCreateIntentLogFilter(source.sourceAddress) as AlchemyEventType,
          this.addJob(source.network),
        )
    })
  }

  addJob(network: Network) {
    return async (event: EventLogWS) => {
      //add network to the event since alchemy doesn`t
      event.network = network
      //add to processing queue
      await this.intentQueue.add(QUEUES.SOURCE_INTENT.jobs.create_intent, event as EventLogWS, {
        jobId: getIntentJobId('websocket', event.transactionHash),
        ...this.intentJobConfig,
      })
    }
  }
}
