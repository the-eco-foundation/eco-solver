import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { getCreateIntentLogFilter } from '../ws/ws.helpers'
import { AlchemyEventType } from 'alchemy-sdk'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { EVENTS } from '../common/events/constants'

/**
 * Service class for solving an intent on chain. When this service starts up,
 * it creates websockets for all the supported prover contracts and listens for
 * events on them. When a new event is detected, it will publish that event to the
 * eventbus.
 */
@Injectable()
export class SoucerIntentWsService implements OnModuleInit {
  private logger = new Logger(SoucerIntentWsService.name)
  constructor(
    private readonly alchemyService: AlchemyService,
    private readonly ecoConfigService: EcoConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.ecoConfigService.getContracts().sourceIntents.forEach((source) => {
      this.alchemyService
        .getAlchemy(source.network)
        .ws.on(getCreateIntentLogFilter(source.sourceAddress) as AlchemyEventType, (event) => {
          this.logger.debug(`Received event: ${event}`)
          this.eventEmitter.emit(EVENTS.SOURCE_INTENT_CREATED, event)
        })
    })
  }
}
