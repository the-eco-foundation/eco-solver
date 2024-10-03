import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { IntentProcessData, UtilsIntentService } from './utils-intent.service'
import { QUEUES } from '../common/redis/constants'
import { JobsOptions, Queue } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { getIntentJobId } from '../common/utils/strings'
import { Solver } from '../eco-configs/eco-config.types'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { ProofService } from '../prover/proof.service'
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { Hex } from 'viem'

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class ValidateIntentService implements OnModuleInit {
  private logger = new Logger(ValidateIntentService.name)
  private intentJobConfig: JobsOptions

  constructor(
    @InjectQueue(QUEUES.SOURCE_INTENT.queue) private readonly intentQueue: Queue,
    @InjectModel(SourceIntentModel.name) private intentModel: Model<SourceIntentModel>,
    private readonly utilsIntentService: UtilsIntentService,
    private readonly proofService: ProofService,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig
  }

  /**
   * @param intentHash the hash of the intent to fulfill
   */
  async validateIntent(intentHash: Hex) {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `validateIntent ${intentHash}`,
        properties: {
          intentHash: intentHash,
        },
      }),
    )

    const { model, solver } = await this.destructureIntent(intentHash)
    if (!model || !solver) {
      return
    }
    const proverUnsupported = !this.supportedProver(model)
    const targetsUnsupported = !this.supportedTargets(model, solver)
    const selectorsUnsupported = !this.supportedSelectors(model, solver)
    const expiresEarly = !this.validExpirationTime(model, solver)

    if (proverUnsupported || targetsUnsupported || selectorsUnsupported || expiresEarly) {
      await this.utilsIntentService.updateInvalidIntentModel(this.intentModel, model, {
        proverUnsupported,
        targetsUnsupported,
        selectorsUnsupported,
        expiresEarly,
      })
      this.logger.log(
        EcoLogMessage.fromDefault({
          message: `Intent failed validation ${model.intent.hash}`,
          properties: {
            intentHash: model.intent.hash,
            sourceNetwork: model.event.sourceNetwork,
            targetsUnsupported,
            selectorsUnsupported,
            expiresEarly,
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
    const jobId = getIntentJobId('validate', intentHash, model.intent.logIndex)
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `validateIntent ${intentHash}`,
        properties: {
          jobId,
        },
      }),
    )
    //add to processing queue
    await this.intentQueue.add(QUEUES.SOURCE_INTENT.jobs.feasable_intent, intentHash, {
      jobId,
      ...this.intentJobConfig,
    })
  }

  private validExpirationTime(model: SourceIntentModel, solver: Solver): boolean {
    //convert to milliseconds
    const time = Number.parseInt(`${model.intent.expiryTime as bigint}`) * 1000
    const expires = new Date(time)
    const validExipration = this.proofService.isIntentExpirationWithinProofMinimumDate(
      solver.chainID,
      expires,
    )
    if (!validExipration) {
      this.logger.log(
        EcoLogMessage.fromDefault({
          message: `validateIntent: Expiration time invalid`,
          properties: {
            intent: model.intent,
            proofMinDurationSeconds: this.proofService
              .getProofMinimumDate(solver.chainID)
              .toUTCString(),
          },
        }),
      )
      return false
    }
    return true
  }

  private supportedSelectors(model: SourceIntentModel, solver: Solver): boolean {
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
      return false
    }
    return true
  }

  /**
   * Checks if the IntentCreated event is using a supported prover. It first finds the source intent contract that is on the
   * source chain of the event. Then it checks if the prover is supported by the source intent.
   *
   * @param model the source intent model
   * @returns
   */
  private supportedProver(model: SourceIntentModel): boolean {
    const srcSolvers = this.ecoConfigService.getSourceIntents().filter((intent) => {
      BigInt(intent.chainID) === model.event.sourceChainID
    })
    return srcSolvers.some((intent) => {
      intent.provers.some((prover) => {
        prover === model.intent.prover
      })
    })
  }

  private supportedTargets(model: SourceIntentModel, solver: Solver): boolean {
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
      return false
    }

    return true
  }

  private async destructureIntent(intentHash: string): Promise<IntentProcessData> {
    const data = await this.utilsIntentService.getProcessIntentData(intentHash)
    const { model, solver, err } = data ?? {}
    if (!model || !solver) {
      if (err) {
        throw err
      }
    }
    return data!
  }
}
