import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { getCreateIntentLogFilter } from '../ws/ws.helpers'
import { AlchemyEventType } from 'alchemy-sdk'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { JobsOptions, Queue } from 'bullmq'
import { QUEUES } from '../common/redis/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { SourceIntentTx } from '../bullmq/processors/dtos/SourceIntentTx.dto'

/**
 * Service class for solving an intent on chain. When this service starts up,
 * it creates websockets for all the supported prover contracts and listens for
 * events on them. When a new event is detected, it will publish that event to the
 * eventbus.
 */
@Injectable()
export class SoucerIntentWsService implements OnModuleInit {
  private logger = new Logger(SoucerIntentWsService.name)
  private intentJobConfig: JobsOptions

  constructor(
    @InjectQueue(QUEUES.SOLVE_INTENT.queue) private readonly solveIntentQueue: Queue,
    private readonly alchemyService: AlchemyService,
    private readonly ecoConfigService: EcoConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig

    this.ecoConfigService.getContracts().sourceIntents.forEach((source) => {
      this.alchemyService.getAlchemy(source.network).ws.on(
        getCreateIntentLogFilter(source.sourceAddress) as AlchemyEventType,
        // this.emitEvent(EVENTS.SOURCE_INTENT_CREATED),
        this.addJob(),
      )
    })
  }

  private addJob() {
    return async (event: any) => {
      //add to processing queue
      await this.solveIntentQueue.add(QUEUES.SOLVE_INTENT.jobs.token, event as SourceIntentTx, {
        jobId: event.transactionHash,
        ...this.intentJobConfig,
      })
    }
  }
  private emitEvent(eventName: any) {
    return (event: any) => {
      this.logger.log(`Received event: ${event}`)
      this.eventEmitter.emit(eventName, event)
    }
  }
}
