import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { SourceIntentTxHash } from '../common/events/websocket'
import { TransactionTargetData, UtilsIntentService } from './utils-intent.service'
import { AASmartAccountService } from '../alchemy/aa-smart-multichain.service'
import { InboxAbi } from '../contracts'
import { encodeFunctionData, erc20Abi, Hex } from 'viem'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { EcoError } from '../common/errors/eco-error'
import { getERC20Selector } from '../common/utils/ws.helpers'
import { Solver } from '../eco-configs/eco-config.types'
import { BatchUserOperationCallData, UserOperationCallData } from '@alchemy/aa-core'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class FulfillIntentService implements OnModuleInit {
  private logger = new Logger(FulfillIntentService.name)

  constructor(
    @InjectModel(SourceIntentModel.name) private intentModel: Model<SourceIntentModel>,
    private readonly utilsIntentService: UtilsIntentService,
    private readonly aaService: AASmartAccountService,
  ) { }

  onModuleInit() { }

  async onApplicationBootstrap() { }

  async executeFullfillIntent(intentHash: SourceIntentTxHash) {
    const data = await this.utilsIntentService.getProcessIntentData(intentHash)
    if (!data) {
      if (data.err) {
        throw data.err
      }
      return
    }
    const { model, solver } = data

    //create the UserOp from the intent
    const executeData = model.intent.targets.map(
      (target, index) => {
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
          return [] as any
        }

        switch (tt.targetConfig.contractType) {
          case 'erc20':
            return this.handleErc20(tt, solver, target)
          case 'erc721':
          case 'erc1155':
          default:
            return [] as any
        }
      },
      [] as UserOperationCallData | BatchUserOperationCallData,
    )

    const flatExecuteData = executeData.flat()

    const smartAccountClient = await this.aaService.getClient(solver.chainID)
    let receipt: any
    try {
      const args = [
        model.event.sourceChainID,
        model.intent.targets,
        model.intent.data,
        model.intent.expiryTime,
        model.intent.nonce,
        smartAccountClient.account.address,
        model.intent.hash,
      ]

      const fulfillIntent = encodeFunctionData({
        abi: InboxAbi,
        functionName: 'fulfill',
        args,
      })
      flatExecuteData.push({
        target: solver.solverAddress,
        data: fulfillIntent,
      })

      this.logger.debug(
        EcoLogMessage.fromDefault({
          message: `Fullfilling batch transaction`,
          properties: {
            batch: flatExecuteData,
          },
        }),
      )

      // @ts-expect-error  flatExecuteData complains here
      const uo = await smartAccountClient.sendUserOperation({
        uo: flatExecuteData,
      })
      //todo this is blocking, we should use a queue
      receipt = await smartAccountClient.waitForUserOperationTransaction(uo)
      model.status = 'SOLVED'
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
      receipt = e
      model.status = 'FAILED'
      this.logger.error(
        EcoLogMessage.withError({
          message: `fulfillIntent: Invalid transaction`,
          error: EcoError.FulfillIntentBatchError,
          properties: {
            model: model,
            flatExecuteData: flatExecuteData,
            error: e,
          },
        }),
      )
    } finally {
      model.receipt = receipt
      await this.intentModel.updateOne(
        {
          'intent.hash': model.intent.hash,
        },
        model,
      )
    }
  }
  /**
   * Checks if the transaction is feasible for an erc20 token transfer.
   *
   * @param tt the transaction target data
   * @param network the target network for the fullfillment
   * @param model the source intent model
   * @param target the target ERC20 address
   * @returns
   */
  handleErc20(
    tt: TransactionTargetData,
    solver: Solver,
    target: Hex,
  ): UserOperationCallData | BatchUserOperationCallData {
    switch (tt.transactionDescription.selector) {
      case getERC20Selector('transfer'):
        const dstAmount = tt.transactionDescription.args[1]

        const transferSolverAmount = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [solver.solverAddress, dstAmount],
        })

        return [
          {
            target,
            data: transferSolverAmount,
          },
        ]

      default:
        return []
    }
  }
}
