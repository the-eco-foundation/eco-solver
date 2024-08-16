import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { SourceIntentTxHash } from '../common/events/websocket'
import { UtilsIntentService } from './utils-intent.service'
import { QUEUES } from '../common/redis/constants'
import { JobsOptions, Queue } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { getIntentJobId } from '../common/utils/strings'

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class ValidateIntentService implements OnModuleInit {
  private logger = new Logger(ValidateIntentService.name)
  private intentJobConfig: JobsOptions

  constructor(
    @InjectQueue(QUEUES.SOURCE_INTENT.queue) private readonly intentQueue: Queue,
    private readonly utilsIntentService: UtilsIntentService,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig
  }

  /**
   * @param intentHash the hash of the intent to fulfill
   */
  async validateIntent(intentHash: SourceIntentTxHash) {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `validateIntent ${intentHash}`,
        properties: {
          intentHash: intentHash,
        },
      }),
    )

    const data = await this.utilsIntentService.getProcessIntentData(intentHash)
    if (!data) {
      if (data.err) {
        throw data.err
      }
      return
    }
    const { model, solver } = data

    //check if the targets are supported
    const targetsSupported = this.utilsIntentService.targetsSupported(model, solver)
    if (!targetsSupported) {
      this.logger.log(
        EcoLogMessage.fromDefault({
          message: `validateIntent: Targets not supported`,
          properties: {
            intent: model.intent,
          },
        }),
      )
      return
    }

    //check if the targets support the selectors encoded in the intent data
    const selectorsSupported = this.utilsIntentService.selectorsSupported(model, solver)
    if (!selectorsSupported) {
      this.logger.log(
        EcoLogMessage.fromDefault({
          message: `validateIntent: Selectors not supported`,
          properties: {
            intent: model.intent,
          },
        }),
      )
      return
    }

    //check that the rewards and amounts are equal sized
    if (model.intent.rewardTokens.length !== model.intent.rewardAmounts.length) {
      this.logger.log(
        EcoLogMessage.fromDefault({
          message: `validateIntent: Rewards mismatch`,
          properties: {
            intent: model.intent,
          },
        }),
      )
      return
    }

    //add to processing queue
    await this.intentQueue.add(QUEUES.SOURCE_INTENT.jobs.feasable_intent, intentHash, {
      jobId: getIntentJobId('validate',intentHash),
      ...this.intentJobConfig,
    })
  }
}
