import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'
import { RedlockService } from '../nest-redlock/nest-redlock.service'
import { EventLogWS } from './dtos/EventLogWS'
import { InjectModel } from '@nestjs/mongoose'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { Model } from 'mongoose'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { decodeCreateIntentLog } from '../ws/ws.helpers'

/**
 * Service class for solving an intent on chain
 */
@Injectable()
export class SourceIntentService implements OnModuleInit {
  private logger = new Logger(SourceIntentService.name)

  constructor(
    private readonly alchemyService: AlchemyService,
    @InjectModel(SourceIntentModel.name) private intentModel: Model<SourceIntentModel>,
    private redlockService: RedlockService,
  ) {}

  onModuleInit() {}

  async createIntent(intentWs: EventLogWS) {
    const intent = decodeCreateIntentLog(intentWs.data, intentWs.topics)
    this.logger.log(`Creating intent: `)
    const lock = await this.redlockService.acquireLock([intent.hash as string], 5000)
    //this instance didn`t get the lock, so just break out here
    if (!lock) {
      return
    }

    try {
      //check db if the intent is already filled
      const model = await this.intentModel.findOne({
        'intent.hash': intent.hash,
      })
      if (model) {
        // Record already exists, do nothing and return
        this.logger.debug(
          EcoLogMessage.fromDefault({
            message: `Record for intent already exists ${intent.hash}`,
            properties: {
              intentHash: intent.hash,
              intent: intent,
            },
          }),
        )
        return
      }

      //update db
      const record = await this.intentModel.create<SourceIntentModel>({
        event: intentWs,
        intent: intent,
        receipt: null,
        status: 'PENDING',
      })
      this.logger.debug(
        EcoLogMessage.fromDefault({
          message: `Recorded intent ${record.intent.hash}`,
          properties: {
            intentHash: intent.hash,
            intent: record.intent,
          },
        }),
      )
    } catch (e) {
    } finally {
      //release the lock after processing
      lock.release()
    }
  }

  // @OnEvent(EVENTS.SOURCE_INTENT_CREATED)
  // async handleSourceIntentCreatedEvent(payload: any) {
  //   let lock: Lock
  //   try {
  //     lock = await this.redlockService.acquire([`test:${1}`], 5000)
  //     await this.delay(2000)
  //     this.logger.log(`Received event: ${payload}`)
  //     lock.release()
  //   } catch (e) {
  //     this.logger.error(e)
  //   }
  // }

  // async acquireLock(hash: string): Promise<Lock | null> {
  //   try {
  //     return await this.redlockService.acquire([hash], 5000)
  //   } catch {
  //     return null
  //   }
  // }
}
