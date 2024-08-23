import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { SourceIntentTxHash } from '../common/events/websocket'
import { JobsOptions, Queue } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { QUEUES } from '../common/redis/constants'
import { TransactionTargetData, UtilsIntentService } from './utils-intent.service'
import { BalanceService } from '../balance/balance.service'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { EcoError } from '../common/errors/eco-error'
import { getERC20Selector } from '../common/utils/ws.helpers'
import { BigNumberish, Network } from 'alchemy-sdk'
import { AddressLike } from 'ethers'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { intersectionBy } from 'lodash'
import { getIntentJobId } from '../common/utils/strings'
import { Solver } from '../eco-configs/eco-config.types'

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class FeasableIntentService implements OnModuleInit {
  private logger = new Logger(FeasableIntentService.name)
  private intentJobConfig: JobsOptions
  private FEE_BASE = 1000n
  private fee: bigint
  constructor(
    @InjectQueue(QUEUES.SOURCE_INTENT.queue) private readonly intentQueue: Queue,
    private readonly balanceService: BalanceService,
    private readonly utilsIntentService: UtilsIntentService,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig
    //todo get this from config or service per token/chain
    this.fee = 1000n
  }

  async feasableIntent(intentHash: SourceIntentTxHash) {
    const data = await this.utilsIntentService.getProcessIntentData(intentHash)
    if (!data) {
      if (data.err) {
        throw data.err
      }
      return
    }
    const { model, solver } = data

    //check if we have tokens on the solver chain
    const feasable = await this.validateExecution(model, solver)

    if (feasable) {
      //add to processing queue
      await this.intentQueue.add(QUEUES.SOURCE_INTENT.jobs.fulfill_intent, intentHash, {
        jobId: getIntentJobId('feasable', intentHash),
        ...this.intentJobConfig,
      })
    }
  }

  /**
   * Checks if the transaction is feasible for an erc20 token transfer.
   *
   * @param tt the transaction target data
   * @param model the source intent model
   * @param solver the target solver
   * @param target  the target address
   * @returns
   */
  async handleErc20(
    tt: TransactionTargetData,
    model: SourceIntentModel,
    solver: Solver,
    target: AddressLike,
  ): Promise<boolean> {
    const targetNetwork = solver.network
    switch (tt.transactionDescription.selector) {
      case getERC20Selector('transfer'):
        //check we have enough tokens to transfer on destination fullfillment
        const balance = await this.balanceService.getTokenBalance(solver.chainID, target as string)
        const amount = tt.transactionDescription.args[1] as bigint
        const solvent = balance.balance >= amount
        const sourceNetwork = model.event.sourceNetwork
        const source = this.ecoConfigService
          .getSourceIntents()
          .find((intent) => intent.network == sourceNetwork)
        if (!source) {
          return false
        }
        //check that we make money on the transfer
        const fullfillAmountUSDC = this.convertToUSDC(
          targetNetwork,
          target as string,
          tt.transactionDescription.args[1] as bigint,
        )
        const profitable = this.isProfitableErc20Transfer(
          sourceNetwork,
          source.tokens,
          model.intent.rewardTokens as string[],
          model.intent.rewardAmounts,
          fullfillAmountUSDC,
        )
        return solvent && profitable
      default:
        return false
    }
  }

  /**
   * Calculates if a transfer is profitable based on the reward tokens and amounts. It converts the reward tokens to a common currency, then applies
   * the fee to the sum of the reward tokens and amounts. If the sum is greater than the fullfill amount, then the transfer is profitable
   *
   * @param network the network to check profitability on
   * @param acceptedTokens  the tokens that we accepte on the source
   * @param rewardTokens  the tokens that are rewarded by the intent
   * @param rewardAmounts  the amounts of the reward tokens
   * @param fullfillAmountUSDC  the amount of the token to transfer on the destination chain
   * @returns
   */
  isProfitableErc20Transfer(
    network: Network,
    acceptedTokens: string[],
    rewardTokens: string[],
    rewardAmounts: BigNumberish[],
    fullfillAmountUSDC: bigint,
  ): boolean {
    let sum = 0n
    intersectionBy(acceptedTokens, rewardTokens).forEach((token) => {
      const index = rewardTokens.findIndex((t) => t == token)
      if (index < 0) {
        return false
      }
      sum += this.convertToUSDC(network, token, BigInt(rewardAmounts[index] as number))
    })

    //check if input tokens are acceptable and greater than + fees
    return sum >= (fullfillAmountUSDC * this.fee) / this.FEE_BASE
  }

  /**
   * Converts a token amount to USDC for that network, we do this in order to have a baseline
   * to compare the profitability of the transaction
   *
   * TODO: right now it just returns a 1-1 conversion, we need to get the price of the token in usdc
   *
   * @param network the network to convert the token to usdc
   * @param token   the token to convert to usdc
   * @param amount  the amount of the token to convert to usdc
   * @returns
   */
  convertToUSDC(network: Network, token: string, amount: bigint): bigint {
    //todo: get the price of the token in usdc instead of assuming 1-1 here
    return amount
  }

  async validateExecution(model: SourceIntentModel, solver: Solver): Promise<boolean> {
    const execs = model.intent.targets.map((target, index) => {
      return this.validateEachExecution(model, solver, target, index)
    })
    return (await Promise.all(execs)).every((e) => e)
  }

  async validateEachExecution(
    model: SourceIntentModel,
    solver: Solver,
    target: AddressLike,
    index: number,
  ) {
    const tt = this.utilsIntentService.getTransactionTargetData(model, solver, target, index)
    if (tt === null) {
      this.logger.error(
        EcoLogMessage.withError({
          message: `feasableIntent: Invalid transaction data`,
          error: EcoError.FeasableIntentNoTransactionError,
          properties: {
            model: model,
          },
        }),
      )
      return false
    }

    switch (tt.targetConfig.contractType) {
      case 'erc20':
        return await this.handleErc20(tt, model, solver, target)
      case 'erc721':
      case 'erc1155':
      default:
        return false
    }
  }
}
