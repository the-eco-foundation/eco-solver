import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'
import { OnEvent } from '@nestjs/event-emitter'
import { EVENTS } from '../common/events/constants'
import { RedlockService } from '../nest-redlock/nest-redlock.service'
import { Lock } from 'redlock'

/**
 * Service class for solving an intent on chain
 */
@Injectable()
export class SoucerIntentService implements OnModuleInit {
  private logger = new Logger(SoucerIntentService.name)

  constructor(
    private readonly alchemyService: AlchemyService,
    private redlockService: RedlockService,
  ) {}

  onModuleInit() {}

  @OnEvent(EVENTS.SOURCE_INTENT_CREATED)
  async handleSourceIntentCreatedEvent(payload: any) {
    let lock: Lock
    try {
      lock = await this.redlockService.acquire([`test:${1}`], 5000)
      await this.delay(2000)
      this.logger.log(`Received event: ${payload}`)
      lock.release()
    } catch (e) {
      this.logger.error(e)
    }
  }
  delay(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }
}
