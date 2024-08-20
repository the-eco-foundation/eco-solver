import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { Model } from 'mongoose'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { Solver, TargetContract } from '../eco-configs/eco-config.types'
import { EcoError } from '../common/errors/eco-error'
import { AddressLike, TransactionDescription } from 'ethers'
import { getFragment } from '../common/utils/fragments'
import { difference, includes } from 'lodash'

/**
 * Data for a transaction target
 */
export interface TransactionTargetData {
  transactionDescription: TransactionDescription
  targetConfig: TargetContract
}

/**
 * Service class for solving an intent on chain
 */
@Injectable()
export class UtilsIntentService implements OnModuleInit {
  private logger = new Logger(UtilsIntentService.name)

  constructor(
    @InjectModel(SourceIntentModel.name) private intentModel: Model<SourceIntentModel>,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  onModuleInit() {}

  selectorsSupported(model: SourceIntentModel, solver: Solver): boolean {
    if (model.intent.targets.length !== model.intent.data.length) {
      this.logger.log(
        EcoLogMessage.fromDefault({
          message: `validateIntent: Target calldata mismatch`,
          properties: {
            intent: model.intent,
          },
        }),
      )
      return false
    }
    return (
      model.intent.targets.length > 0 &&
      model.intent.targets.every((target, index) => {
        const tx = this.getTransactionTargetData(model, solver, target, index)
        return tx
      })
    )
  }

  getTransactionTargetData(
    model: SourceIntentModel,
    solver: Solver,
    target: AddressLike,
    index: number,
  ): TransactionTargetData | null {
    const data = model.intent.data[index]
    const targetConfig = solver.targets[target as string]
    if (!targetConfig) {
      //shouldn't happen since we do this.targetsSupported(model, solver) before this call
      throw EcoError.SourceIntentTargetConfigNotFound(target as string)
    }
    const frag = getFragment(targetConfig.contractType)
    const tx = frag.parseTransaction({ data: data as string })
    const supported = tx && includes(targetConfig.selectors, tx.signature)
    if (!supported) {
      this.logger.log(
        EcoLogMessage.fromDefault({
          message: `Selectors not supported for intent ${model.intent.hash}`,
          properties: {
            intentHash: model.intent.hash,
            network: model.event.network,
            unsupportedSelector: tx.signature,
          },
        }),
      )
      return null
    }
    return { transactionDescription: tx, targetConfig }
  }

  targetsSupported(model: SourceIntentModel, solver: Solver): boolean {
    //all targets are included in the solver targets array
    const targetsSupported =
      difference(model.intent.targets, Object.keys(solver.targets)).length == 0

    if (!targetsSupported) {
      this.logger.warn(
        EcoLogMessage.fromDefault({
          message: `Targets not supported for intent ${model.intent.hash}`,
          properties: {
            intentHash: model.intent.hash,
            network: model.event.network,
          },
        }),
      )
      return
    }
    return targetsSupported
  }

  async getProcessIntentData(
    intentHash: string,
  ): Promise<{ model: SourceIntentModel; solver: Solver; err?: EcoError } | undefined> {
    const model = await this.intentModel.findOne({
      'intent.hash': intentHash,
    })
    if (!model) {
      return { model: null, solver: null, err: EcoError.SourceIntentDataNotFound(intentHash) }
    }

    const solver = this.ecoConfigService.getSolver(model.intent.destinationChain as number)
    if (!solver) {
      this.logger.log(
        EcoLogMessage.fromDefault({
          message: `No solver found for chain ${model.intent.destinationChain}`,
          properties: {
            intentHash: intentHash,
            network: model.event.network,
          },
        }),
      )
      return null
    }
    return { model, solver }
  }
}
