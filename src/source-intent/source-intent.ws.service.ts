import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { getCreateIntentLogFilter } from '../ws/ws.helpers'
import { AlchemyEventType, Network } from 'alchemy-sdk'
import { JobsOptions, Queue } from 'bullmq'
import { QUEUES } from '../common/redis/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { SourceIntentTx } from '../bullmq/processors/dtos/SourceIntentTx.dto'
import { EventLogWS } from './dtos/EventLogWS'
import { EcoLogMessage } from '../common/logging/eco-log-message'

/**
 * Service class for solving an intent on chain. When this service starts up,
 * it creates websockets for all the supported prover contracts and listens for
 * events on them. When a new event is detected, it will publish that event to the
 * eventbus.
 */
@Injectable()
export class SourceIntentWsService implements OnModuleInit {
  private logger = new Logger(SourceIntentWsService.name)
  private intentJobConfig: JobsOptions

  constructor(
    @InjectQueue(QUEUES.CREATE_INTENT.queue) private readonly solveIntentQueue: Queue,
    private readonly alchemyService: AlchemyService,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig
    this.ecoConfigService.getContracts().sourceIntents.forEach((source) => {
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
      this.logger.debug(
        EcoLogMessage.fromDefault({
          message: `SourceIntentWsService: ws event`,
          properties: {
            event: event,
          },
        }),
      )
      //add to processing queue
      await this.solveIntentQueue.add(
        QUEUES.CREATE_INTENT.jobs.create_intent,
        event as SourceIntentTx,
        {
          jobId: event.transactionHash,
          ...this.intentJobConfig,
        },
      )
    }
  }
}
