import { Injectable, Logger } from '@nestjs/common'
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { encodeFunctionData, erc20Abi, Hex } from 'viem'
import {
  IntentProcessData,
  TransactionTargetData,
  UtilsIntentService,
} from './utils-intent.service'
import { getERC20Selector, InboxAbi, PROOF_HYPERLANE, PROOF_STORAGE } from '../contracts'
import { EcoError } from '../common/errors/eco-error'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { Solver } from '../eco-configs/eco-config.types'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { SimpleAccountClientService } from '../transaction/simple-account-client.service'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { ProofService } from '../prover/proof.service'

/**
 * This class fulfills an intent by creating the transactions for the intent targets and the fulfill intent transaction.
 */
@Injectable()
export class FulfillIntentService {
  private logger = new Logger(FulfillIntentService.name)

  constructor(
    @InjectModel(SourceIntentModel.name) private intentModel: Model<SourceIntentModel>,
    private readonly simpleAccountClientService: SimpleAccountClientService,
    private readonly proofService: ProofService,
    private readonly utilsIntentService: UtilsIntentService,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  /**
   * Executes the fulfill intent process for an intent. It creates the transaction for fulfillment, and posts it
   * to the chain. It then updates the db model of the intent with the status and receipt.
   *
   * @param intentHash the intent hash to fulfill
   * @returns
   */
  async executeFulfillIntent(intentHash: Hex) {
    const data = await this.utilsIntentService.getIntentProcessData(intentHash)
    const { model, solver, err } = data ?? {}
    if (!data || !model || !solver) {
      if (err) {
        throw err
      }
      return
    }

    const simpleAccountClient = await this.simpleAccountClientService.getClient(solver.chainID)

    // Create transactions for intent targets
    const targetSolveTxs = this.getTransactionsForTargets(data)

    // Create fulfill tx
    const fulfillTx = this.getFulfillIntentTx(solver.solverAddress, model)

    // Combine all transactions
    const transactions = [...targetSolveTxs, fulfillTx]

    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `Fulfilling batch transaction`,
        properties: {
          batch: transactions,
        },
      }),
    )

    try {
      const transactionHash = await simpleAccountClient.execute(transactions)

      const receipt = await simpleAccountClient.waitForTransactionReceipt({ hash: transactionHash })

      // set the status and receipt for the model
      model.status = 'SOLVED'
      model.receipt = receipt as any

      this.logger.debug(
        EcoLogMessage.fromDefault({
          message: `Fulfilled transactionHash ${receipt.transactionHash}`,
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
            errorPassed: e,
          },
        }),
      )

      // Throw error to retry job
      throw e
    } finally {
      // Update the db model
      await this.utilsIntentService.updateIntentModel(this.intentModel, model)
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
    switch (tt.selector) {
      case getERC20Selector('transfer'):
        const dstAmount = tt.decodedFunctionData.args?.[1] as bigint

        const transferFunctionData = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [solver.solverAddress, dstAmount],
        })

        return [{ to: target, data: transferFunctionData }]
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
      const tt = this.utilsIntentService.getTransactionTargetData(
        model,
        solver,
        target,
        model.intent.data[index],
      )
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
  private getFulfillIntentTx(solverAddress: Hex, model: SourceIntentModel) {
    const walletAddr = this.ecoConfigService.getEth().claimant
    const proof = this.proofService.getProofType(model.intent.prover)
    const functionName = proof === PROOF_STORAGE ? 'fulfillStorage' : 'fulfillHyperInstant'
    const encodeProverAddress = proof === PROOF_HYPERLANE ? model.intent.prover : undefined
    const args = [
      model.event.sourceChainID,
      model.intent.targets,
      model.intent.data,
      model.intent.expiryTime,
      model.intent.nonce,
      walletAddr,
      model.intent.hash,
    ]
    if (encodeProverAddress) {
      args.push(encodeProverAddress)
    }
    const fulfillIntentData = encodeFunctionData({
      abi: InboxAbi,
      functionName,
      // @ts-expect-error we dynamically set the args
      args,
    })

    return {
      to: solverAddress,
      data: fulfillIntentData,
    }
  }
}
