import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { SourceIntentTxHash } from '../common/events/websocket'
import { JobsOptions, Queue } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { QUEUES } from '../common/redis/constants'
import { TransactionTargetData, UtilsIntentService } from './utils-intent.service'
import { BalanceService } from '../balance/balance.service'
import { AASmartAccountService } from '../alchemy/aa-smart-multichain.service'
import { ERC20Abi, InboxAbi } from '../contracts'
import { encodeFunctionData, erc20Abi, Hex } from 'viem'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { EcoError } from '../common/errors/eco-error'
import { getERC20Selector } from '../common/utils/ws.helpers'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { AddressLike, Network } from 'ethers'
import { Solver } from '../eco-configs/eco-config.types'
import { BatchUserOperationCallData, UserOperationCallData } from '@alchemy/aa-core'

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class FulfillIntentService implements OnModuleInit {
  private logger = new Logger(FulfillIntentService.name)
  private intentJobConfig: JobsOptions

  constructor(
    @InjectQueue(QUEUES.SOURCE_INTENT.queue) private readonly intentQueue: Queue,
    private readonly balanceService: BalanceService,
    private readonly utilsIntentService: UtilsIntentService,
    private readonly aaService: AASmartAccountService,
    private readonly ecoConfigService: EcoConfigService,
  ) { }

  onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig

  }

  async onApplicationBootstrap() {

  }

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
    const executeData = model.intent.targets.map((target, index) => {
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
          return this.handleErc20(tt, solver, model, target)
        case 'erc721':
        case 'erc1155':
        default:
          return [] as any
      }
    }, [] as UserOperationCallData | BatchUserOperationCallData)

    const flatExecuteData = executeData.flat()
    const smartAccountClient = await this.aaService.getClient(solver.chainID)
    
    try {
      const fulfillIntent = encodeFunctionData({
        abi: InboxAbi,
        functionName: "fulfill",
        args: [
          model.event.sourceChainID, 
          model.intent.targets, 
          model.intent.data, 
          model.intent.expiryTime, 
          model.intent.nonce, 
          smartAccountClient.account.address, 
          model.intent.hash],
      //   uint256 _sourceChainID,
      // address[] calldata _targets,
      // bytes[] calldata _data,
      // uint256 _expiryTime,
      // bytes32 _nonce,
      // address _claimant,
      // bytes32 _expectedHash
      })
      flatExecuteData.push({
        target: solver.solverAddress,
        data: fulfillIntent,
      })

      // @ts-ignore
      const uo = await smartAccountClient.sendUserOperation({
        uo: flatExecuteData,
      })
      console.log(uo)
      const txHash = await smartAccountClient.waitForUserOperationTransaction(uo)
      console.log(txHash)
    } catch (e) {
      console.log(e)
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
    model: SourceIntentModel,
    target: Hex,
  ): UserOperationCallData | BatchUserOperationCallData {
    switch (tt.transactionDescription.selector) {
      case getERC20Selector('transfer'):
        const [dstAccount, dstAmount] = [tt.transactionDescription.args[0], tt.transactionDescription.args[1]]

        const approveSolverTransferAmount = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [solver.solverAddress, dstAmount],
        })
       

        return [
          {
            target,
            data: approveSolverTransferAmount,
          }
        ]

        // return [
        //   {
        //     target: target,
        //     data: encodeFunctionData({
        //       abi: erc20Abi,
        //       functionName: "balanceOf",
        //       args: [dstAccount],
        //     }),
        //   },
        // ]
      default:
        return []
    }
  }

  // async a() {
  //   const smartAccountClient = await this.aaService.getClient(11155420)
  //   const uoCallData = encodeFunctionData({
  //     abi: [{
  //       "inputs": [
  //         {
  //           "internalType": "uint256",
  //           "name": "amount",
  //           "type": "uint256"
  //         }
  //       ],
  //       "name": "mint",
  //       "outputs": [],
  //       "stateMutability": "nonpayable",
  //       "type": "function"
  //     }],
  //     functionName: "mint",
  //     args: [3000000000n],
  //   })

  //   // @ts-ignore
  //   const uo = await smartAccountClient.sendUserOperation({
  //     uo: {
  //       target: "0xd3F4Bef596a04e2be4fbeB17Dd70f02F717c5a6c",
  //       data: uoCallData,
  //     },
  //   })
  //   // smartAccountClient.sendTransaction({
  //   //   to: "0xd3F4Bef596a04e2be4fbeB17Dd70f02F717c5a6c",
  //   //   data: uoCallData,
  //   //   nonce: 1n
  //   // })
  //   // const tx = await smartAccountClient.readContract({
  //   //   address: "0xd3F4Bef596a04e2be4fbeB17Dd70f02F717c5a6c",
  //   //   abi: ERC20Abi,
  //   //   functionName: "balanceOf",
  //   //   args: [smartAccountClient.account.address]
  //   // })
  //   // console.log(tx)
  //   const txHash = await smartAccountClient.waitForUserOperationTransaction(uo)
  //   console.log(txHash)

  //   const tx = await smartAccountClient.readContract({
  //     address: "0xd3F4Bef596a04e2be4fbeB17Dd70f02F717c5a6c",
  //     abi: ERC20Abi,
  //     functionName: "balanceOf",
  //     args: [smartAccountClient.account.address]
  //   })
  //   console.log(tx)
  // }
}
