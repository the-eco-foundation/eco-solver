import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'
import { RedlockService } from '../nest-redlock/nest-redlock.service'
import { EventLogWS, SourceIntentTxHash } from './dtos/EventLogWS'
import { InjectModel } from '@nestjs/mongoose'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { Model } from 'mongoose'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { decodeCreateIntentLog } from '../ws/ws.helpers'
import { InjectQueue } from '@nestjs/bullmq'
import { QUEUES } from '../common/redis/constants'
import { JobsOptions, Queue } from 'bullmq'
import { EcoConfigService } from '../eco-configs/eco-config.service'

/**
 * Service class for solving an intent on chain
 */
@Injectable()
export class SourceIntentService implements OnModuleInit {
  private logger = new Logger(SourceIntentService.name)
  private intentJobConfig: JobsOptions
  constructor(
    private readonly alchemyService: AlchemyService,
    @InjectQueue(QUEUES.SOURCE_INTENT.queue) private readonly intentQueue: Queue,
    @InjectModel(SourceIntentModel.name) private intentModel: Model<SourceIntentModel>,
    private redlockService: RedlockService,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig
  }

  async createIntent(intentWs: EventLogWS) {
    this.logger.log(`Creating intent: `)
    const intent = decodeCreateIntentLog(intentWs.data, intentWs.topics)
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

      //add to processing queue
      await this.intentQueue.add(QUEUES.SOURCE_INTENT.jobs.process_intent, intent.hash, {
        jobId: intent.hash as string,
        ...this.intentJobConfig,
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

  /**
   * This function kicks of the process of fulfilling an intent. It's called
   * by the queue processor when it's time to fulfill the intent.
   * {@link QUEUES.SOURCE_INTENT.jobs.process_intent}
   * @param intentHash the hash of the intent to fulfill
   */
  async processIntent(intentHash: SourceIntentTxHash) {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `Processing intent ${intentHash}`,
        properties: {
          intentHash: intentHash,
        },
      }),
    )
  }
}
