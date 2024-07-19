import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'
import { RedlockService } from '../nest-redlock/nest-redlock.service'
import { SourceIntentWS } from './dtos/SourceIntentWS'
import { InjectModel } from '@nestjs/mongoose'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { Model } from 'mongoose'
import { EcoLogMessage } from '../common/logging/eco-log-message'

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

  async createIntent(data: SourceIntentWS) {
    this.logger.log(`Creating intent: ${data}`)
    const lock = await this.redlockService.acquireLock([data.transactionHash], 5000)
    //this instance didn`t get the lock, so just break out here
    if (!lock) {
      return
    }

    try {
      //check db if the intent is already filled
      const model = await this.intentModel.findOne({
        'intentData.transactionHash': data.transactionHash,
      })
      if (model) {
        // Record already exists, do nothing and return
        this.logger.debug(
          EcoLogMessage.fromDefault({
            message: `Record for intent already exists ${data.transactionHash}`,
            properties: {
              eventHash: data.transactionHash,
              event: data,
            },
          }),
        )
        return
      }

      //update db
      const record = await this.intentModel.create<SourceIntentModel>({
        intentData: data,
        receipt: null,
        status: 'PENDING',
      })
      this.logger.debug(
        EcoLogMessage.fromDefault({
          message: `Recorded intent ${record.intentData.transactionHash}`,
          properties: {
            eventHash: data.transactionHash,
            event: record.intentData,
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
