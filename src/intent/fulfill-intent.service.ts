import { Injectable, Logger } from '@nestjs/common'
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { createPublicClient, encodeFunctionData, erc20Abi, Hex } from 'viem'
import {
  IntentProcessData,
  TransactionTargetData,
  UtilsIntentService,
} from './utils-intent.service'
import { InboxAbi } from '../contracts'
import { EcoError } from '../common/errors/eco-error'
import { getERC20Selector } from '../common/utils/ws.helpers'
import { SourceIntentTxHash } from '../common/events/websocket'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { Solver } from '../eco-configs/eco-config.types'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { SAClientService } from '../transaction/sa-client.service'
import { EcoConfigService } from '../eco-configs/eco-config.service'

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class FulfillIntentService {
  private logger = new Logger(FulfillIntentService.name)

  constructor(
    @InjectModel(SourceIntentModel.name) private intentModel: Model<SourceIntentModel>,
    private readonly utilsIntentService: UtilsIntentService,
    private readonly saClientService: SAClientService,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  async executeFulfillIntent(intentHash: SourceIntentTxHash) {
    const data = await this.utilsIntentService.getProcessIntentData(intentHash)
    const { model, solver, err } = data ?? {}
    if (!err || !model || !solver) {
      if (err) {
        throw err
      }
      return
    }
   
    const smartAccountClient = await this.saClientService.getClient(solver.chainID)

    // Create transactions for intent targets
    const targetSolveTxs = this.getTransactionsForTargets(data!)

    // Create fulfill tx
    const fulfillIntentData = this.getFulfillIntentData(
      this.ecoConfigService.getEth().claimant,
      model!,
    )
    const fulfillTx = {
      to: solver!.solverAddress,
      data: fulfillIntentData,
    }

    // Combine all transactions
    const transactions = [...targetSolveTxs, fulfillTx]

    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `Fullfilling batch transaction`,
        properties: {
          batch: transactions,
        },
      }),
    )

    try {
      const transactionHash = await smartAccountClient.execute(transactions)

      // const publicClient = createPublicClient({
      //   chain: smartAccountClient.walletClient.chain,
      //   transport: smartAccountClient.walletClient.transport as any,
      // })

      const receipt = await smartAccountClient.waitForTransactionReceipt({ hash: transactionHash })

      model.status = 'SOLVED'
      model.receipt = receipt as any

      this.logger.debug(
        EcoLogMessage.fromDefault({
          message: `Fulfilled transaction ${receipt}`,
          properties: {
            userOPHash: receipt,
            destinationChainID: model.intent.destinationChainID,
            sourceChainID: model.event.sourceChainID,
          },
        }),
      )
    } catch (e) {
      model.status = 'FAILED'
      model.receipt = e

      this.logger.error(
        EcoLogMessage.withError({
          message: `fulfillIntent: Invalid transaction`,
          error: EcoError.FulfillIntentBatchError,
          properties: {
            model: model,
            flatExecuteData: transactions,
            error: e,
          },
        }),
      )
    } finally {
      await this.updateTransactionReceipt(model)
    }
  }

  /**
   * Checks if the transaction is feasible for an erc20 token transfer.
   *
   * @param tt the transaction target data
   * @param solver the target solver
   * @param target the target ERC20 address
   * @returns
   */
  handleErc20(tt: TransactionTargetData, solver: Solver, target: Hex) {
    switch (tt.transactionDescription.selector) {
      case getERC20Selector('transfer'):
        const dstAmount = tt.transactionDescription.args[1]

        const transferSolverAmount = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [solver.solverAddress, dstAmount],
        })

        return [{ to: target, data: transferSolverAmount }]
      default:
        return []
    }
  }

  /**
   * Returns the transactions for the intent targets
   * @param intentProcessData
   * @private
   */
  private getTransactionsForTargets(intentProcessData: IntentProcessData) {
    const { model, solver } = intentProcessData
    if (!model || !solver) {
      return []
    }

    // Create transactions for intent targets
    return model.intent.targets.flatMap((target, index) => {
      const tt = this.utilsIntentService.getTransactionTargetData(model, solver, target, index)
      if (tt === null) {
        this.logger.error(
          EcoLogMessage.withError({
            message: `fulfillIntent: Invalid transaction data`,
            error: EcoError.FulfillIntentNoTransactionError,
            properties: {
              model: model,
            },
          }),
        )
        return []
      }

      switch (tt.targetConfig.contractType) {
        case 'erc20':
          return this.handleErc20(tt, solver, target)
        case 'erc721':
        case 'erc1155':
        default:
          return []
      }
    })
  }

  /**
   * Returns the fulfill intent data
   * @param walletAddr
   * @param model
   * @private
   */
  private getFulfillIntentData(walletAddr: string, model: SourceIntentModel) {
    return encodeFunctionData({
      abi: InboxAbi,
      functionName: 'fulfill',
      args: [
        model.event.sourceChainID,
        model.intent.targets,
        model.intent.data,
        model.intent.expiryTime,
        model.intent.nonce,
        walletAddr,
        model.intent.hash,
      ],
    })
  }

  /**
   * Updates the transaction receipt
   * @param model
   * @private
   */
  private updateTransactionReceipt(model: SourceIntentModel) {
    return this.intentModel.updateOne({ 'intent.hash': model.intent.hash }, model)
  }
}
