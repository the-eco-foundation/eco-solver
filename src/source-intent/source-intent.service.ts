import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyService } from '../alchemy/alchemy.service'
import { RedlockService } from '../nest-redlock/nest-redlock.service'
import { EventLogWS, SourceIntentTxHash } from './dtos/EventLogWS'
import { InjectModel } from '@nestjs/mongoose'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { Model } from 'mongoose'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { decodeCreateIntentLog } from '../common/utils/ws.helpers'
import { InjectQueue } from '@nestjs/bullmq'
import { QUEUES } from '../common/redis/constants'
import { JobsOptions, Queue } from 'bullmq'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { Solver, TargetContractType } from '../eco-configs/eco-config.types'
import { EcoError } from '../common/errors/eco-error'
import { includes, isEqual } from 'lodash'
import { ERC20__factory } from '../typing/contracts'
import { AddressLike, Interface, TransactionDescription } from 'ethers'

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
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `createIntent ${intentWs.transactionHash}`,
        properties: {
          intentHash: intentWs.transactionHash,
        },
      }),
    )
    const intent = decodeCreateIntentLog(intentWs.data, intentWs.topics)
    await this.redlockService.lockCall(intent.hash as string, async () => {
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
    })
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

    const data = await this.getProcessIntentData(intentHash)
    if (!data) {
      if (data.err) {
        throw data.err
      }
      return
    }
    const { model, solver } = data

    //check if the targets are supported
    const targetsSupported = this.targetsSupported(model, solver)
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
    const selectorsSupported = this.selectorsSupported(model, solver)
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
      jobId: intentHash,
      ...this.intentJobConfig,
    })
  }

  async feasableIntent(intentHash: SourceIntentTxHash) {
    const data = await this.getProcessIntentData(intentHash)
    if (!data) {
      if (data.err) {
        throw data.err
      }
      return
    }
    const { model, solver } = data

    //check if we have tokens on the solver chain
    model.intent.targets.forEach((target, index) => {
      // const tx = this.getTransactionDescription(model, solver, target, index)
      // tx.args[0]
      //todo
      // TransactionDescription {
      //   fragment: FunctionFragment {
      //     type: 'function',
      //     inputs: [ [ParamType], [ParamType] ],
      //     name: 'transfer',
      //     constant: false,
      //     outputs: [ [ParamType] ],
      //     stateMutability: 'nonpayable',
      //     payable: false,
      //     gas: null
      //   },
      //   name: 'transfer',
      //   args: Result(2) [ '0xCd80B973e7CBB93C21Cc5aC0A5F45D12A32582aa', 1234n ],
      //   signature: 'transfer(address,uint256)',
      //   selector: '0xa9059cbb',
      //   value: 0n
      // }
    })

    //check if input tokens are acceptable and greater than + fees
  }

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
        const tx = this.getTransactionDescription(model, solver, target, index)
        return tx
      })
    )
  }

  getTransactionDescription(
    model: SourceIntentModel,
    solver: Solver,
    target: AddressLike,
    index: number,
  ): TransactionDescription | null {
    const data = model.intent.data[index]
    const targetConfig = solver.targets[target as string]
    if (!targetConfig) {
      //shouldn't happen since we do this.targetsSupported(model, solver) before this call
      throw EcoError.SourceIntentTargetConfigNotFound(target as string)
    }
    const frag = this.getFragment(targetConfig.contractType)
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
    }
    return null
  }

  getFragment(targetType: TargetContractType): Interface {
    switch (targetType) {
      case 'erc20':
        return ERC20__factory.createInterface()
      case 'erc721':
      case 'erc1155':
      default:
        throw EcoError.SourceIntentUnsupportedTargetType(targetType)
    }
  }

  targetsSupported(model: SourceIntentModel, solver: Solver): boolean {
    const targetsSupported = isEqual(
      model.intent.targets.sort(),
      Object.keys(solver.targets).sort(),
    )
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
