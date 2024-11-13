import { Injectable, Logger } from '@nestjs/common'
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { encodeAbiParameters, encodeFunctionData, erc20Abi, Hex, pad } from 'viem'
import {
  IntentProcessData,
  TransactionTargetData,
  UtilsIntentService,
} from './utils-intent.service'
import { getERC20Selector } from '../contracts'
import { EcoError } from '../common/errors/eco-error'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { Solver } from '../eco-configs/eco-config.types'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { ProofService } from '../prover/proof.service'
import { ExecuteSmartWalletArg } from '../transaction/smart-wallets/smart-wallet.types'
import { KernelAccountClientService } from '../transaction/smart-wallets/kernel/kernel-account-client.service'
import { InboxAbi } from '@ecoinc/ecoism'

/**
 * This class fulfills an intent by creating the transactions for the intent targets and the fulfill intent transaction.
 */
@Injectable()
export class FulfillIntentService {
  private logger = new Logger(FulfillIntentService.name)

  constructor(
    @InjectModel(SourceIntentModel.name) private intentModel: Model<SourceIntentModel>,
    private readonly kernelAccountClientService: KernelAccountClientService,
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
    // If the intent is already solved, return
    // Could happen if redis has pending job while this is still executing
    if (model.status === 'SOLVED') {
      return
    }

    const kernelAccountClient = await this.kernelAccountClientService.getClient(solver.chainID)

    // Create transactions for intent targets
    const targetSolveTxs = this.getTransactionsForTargets(data)

    // Create fulfill tx
    const fulfillTx = await this.getFulfillIntentTx(solver.solverAddress, model)

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
      const transactionHash = await kernelAccountClient.execute(transactions)

      const receipt = await kernelAccountClient.waitForTransactionReceipt({ hash: transactionHash })

      // set the status and receipt for the model
      model.receipt = receipt as any
      if (receipt.status === 'reverted') {
        throw EcoError.FulfillIntentRevertError(receipt)
      }
      model.status = 'SOLVED'

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
      model.receipt = model.receipt ? { previous: model.receipt, current: e } : e

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
  private async getFulfillIntentTx(
    solverAddress: Hex,
    model: SourceIntentModel,
  ): Promise<ExecuteSmartWalletArg> {
    const walletAddr = this.ecoConfigService.getEth().claimant
    const isHyperlane = this.proofService.isHyperlaneProver(model.intent.prover)
    const functionName = this.proofService.isStorageProver(model.intent.prover)
      ? 'fulfillStorage'
      : 'fulfillHyperInstant'
    const encodeProverAddress = isHyperlane ? model.intent.prover : undefined
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

    let fee = 0n
    if (isHyperlane) {
      fee = BigInt((await this.getHyperlaneFee(solverAddress, model)) || '0x0')
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
      // ...(isHyperlane && fee > 0 && { value: fee }),
      value: fee,
    }
  }

  /**
   * Returns the hyperlane fee
   * @param prover
   * @private
   */
  private async getHyperlaneFee(
    solverAddress: Hex,
    model: SourceIntentModel,
  ): Promise<Hex | undefined> {
    const client = await this.kernelAccountClientService.getClient(
      Number(model.intent.destinationChainID),
    )
    const encodedMessageBody = encodeAbiParameters(
      [{ type: 'bytes[]' }, { type: 'address[]' }],
      [[model.intent.hash], [this.ecoConfigService.getEth().claimant]],
    )

    const args = [
      model.event.sourceChainID, //_sourceChainID
      encodedMessageBody, //_messageBody
      pad(model.intent.prover), //_prover
    ]
    const callData = encodeFunctionData({
      abi: InboxAbi,
      functionName: 'fetchFee',
      // @ts-expect-error we dynamically set the args
      args,
    })
    const proverData = await client.call({
      to: solverAddress,
      data: callData,
    })
    return proverData.data
  }
}
