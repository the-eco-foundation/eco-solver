import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { EventLogWS } from '../common/events/websocket'
import { QUEUES } from '../common/redis/constants'
import { JobsOptions, Queue } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { decodeCreateIntentLog } from '../common/utils/ws.helpers'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { getIntentJobId } from '../common/utils/strings'

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class CreateIntentService implements OnModuleInit {
  private logger = new Logger(CreateIntentService.name)
  private intentJobConfig: JobsOptions

  constructor(
    @InjectQueue(QUEUES.SOURCE_INTENT.queue) private readonly intentQueue: Queue,
    @InjectModel(SourceIntentModel.name) private intentModel: Model<SourceIntentModel>,
    private readonly ecoConfigService: EcoConfigService,
  ) { }

  onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig
  }

  async createIntent(intentWs: EventLogWS) {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `createIntent ${intentWs.transactionHash}`,
        properties: {
          intentHash: intentWs.transactionHash,
        },
      }),
    )
    const intent = decodeCreateIntentLog(intentWs.data, intentWs.topics)

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

    //create db record
    const record = await this.intentModel.create<SourceIntentModel>({
      event: intentWs,
      intent: intent,
      receipt: null,
      status: 'PENDING',
    })

    //add to processing queue
    await this.intentQueue.add(QUEUES.SOURCE_INTENT.jobs.validate_intent, intent.hash, {
      jobId: getIntentJobId('create', intent.hash as string),
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
  }
}
