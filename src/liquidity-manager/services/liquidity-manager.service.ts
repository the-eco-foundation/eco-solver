import { InjectFlowProducer, InjectQueue } from '@nestjs/bullmq'
import { FlowProducer } from 'bullmq'
import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { groupBy } from 'lodash'
import { BalanceService } from '@/balance/balance.service'
import { TokenState } from '@/liquidity-manager/types/token-state.enum'
import {
  analyzeToken,
  analyzeTokenGroup,
  getGroupTotal,
  getSortGroupByDiff,
} from '@/liquidity-manager/utils/token'
import {
  LiquidityManagerQueue,
  LiquidityManagerQueueType,
} from '@/liquidity-manager/queues/liquidity-manager.queue'
import { RebalanceJob } from '@/liquidity-manager/jobs/rebalance.job'
import { LiquidityProviderManagerService } from '@/liquidity-manager/services/liquidity-provider-manager.service'

@Injectable()
export class LiquidityManagerService implements OnApplicationBootstrap {
  private readonly PERCENTAGE_UP = 0.1
  private readonly PERCENTAGE_DOWN = 0.2
  // The maximum slippage around target balance for a token
  private readonly TARGET_SLIPPAGE = 0.02
  private readonly liquidityManagerQueue: LiquidityManagerQueue

  constructor(
    @InjectQueue(LiquidityManagerQueue.queueName)
    queue: LiquidityManagerQueueType,
    @InjectFlowProducer(LiquidityManagerQueue.flowName)
    protected liquidityManagerFlowProducer: FlowProducer,
    public readonly balanceService: BalanceService,
    public readonly liquidityProviderManager: LiquidityProviderManagerService,
  ) {
    this.liquidityManagerQueue = new LiquidityManagerQueue(queue)
  }

  onApplicationBootstrap() {
    return this.liquidityManagerQueue.startCronJobs()
  }

  async analyzeTokens() {
    const balances: LiquidityManager.TokenData[] = await this.balanceService.getAllTokenBalances()
    const analysis: LiquidityManager.TokenDataAnalyzed[] = balances.map((item) => ({
      ...item,
      analysis: this.analyzeToken(item),
    }))

    const groups = groupBy(analysis, (item) => item.analysis.state)
    return {
      items: analysis,
      surplus: analyzeTokenGroup(groups[TokenState.SURPLUS] ?? []),
      deficit: analyzeTokenGroup(groups[TokenState.DEFICIT] ?? []),
    }
  }

  analyzeToken(token: LiquidityManager.TokenData) {
    return analyzeToken(token.config, token.balance, {
      up: this.PERCENTAGE_UP,
      down: this.PERCENTAGE_DOWN,
      targetSlippage: this.TARGET_SLIPPAGE,
    })
  }

  /**
   * Gets the optimized rebalancing for the deficit and surplus tokens.
   * @dev The rebalancing is more efficient if done within the same chain.
   *      If it's not possible, other chains are considered.
   * @param deficitToken
   * @param surplusTokens
   */
  async getOptimizedRebalancing(
    deficitToken: LiquidityManager.TokenDataAnalyzed,
    surplusTokens: LiquidityManager.TokenDataAnalyzed[],
  ) {
    const swapQuotes = await this.getSwapQuotes(deficitToken, surplusTokens)
    return swapQuotes ?? (await this.getRebalancingQuotes(deficitToken, surplusTokens))
  }

  startRebalancing(rebalances: LiquidityManager.RebalanceRequest[]) {
    const jobs = rebalances.map((rebalance) =>
      RebalanceJob.createJob(rebalance, this.liquidityManagerQueue.name),
    )
    return this.liquidityManagerFlowProducer.add({
      name: 'rebalance-batch',
      queueName: this.liquidityManagerQueue.name,
      children: jobs,
    })
  }

  /**
   * Checks if a swap is possible between the deficit and surplus tokens.
   * @dev swaps are possible if the deficit is compensated by the surplus of tokens in the same chain.
   * @param deficitToken
   * @param surplusTokens
   * @private
   */
  private async getSwapQuotes(
    deficitToken: LiquidityManager.TokenDataAnalyzed,
    surplusTokens: LiquidityManager.TokenDataAnalyzed[],
  ) {
    const surplusTokensSameChain = surplusTokens.filter(
      (token) => token.config.chainId === deficitToken.config.chainId,
    )

    return this.getRebalancingQuotes(deficitToken, surplusTokensSameChain)
  }

  /**
   * Checks if a rebalancing is possible between the deficit and surplus tokens.
   * @param deficitToken
   * @param surplusTokens
   * @private
   */
  private async getRebalancingQuotes(
    deficitToken: LiquidityManager.TokenDataAnalyzed,
    surplusTokens: LiquidityManager.TokenDataAnalyzed[],
  ) {
    const sortedSurplusTokens = getSortGroupByDiff(surplusTokens)
    const surplusTokensTotal = getGroupTotal(sortedSurplusTokens)

    if (deficitToken.analysis.diff > surplusTokensTotal) {
      return undefined
    }

    const quotes: LiquidityManager.Quote[] = []
    let currentBalance = deficitToken.analysis.balance.current

    for (const surplusToken of sortedSurplusTokens) {
      // Calculate the amount to swap
      const swapAmount = Math.min(deficitToken.analysis.diff, surplusToken.analysis.diff)

      const quote = await this.liquidityProviderManager.getQuote(
        surplusToken,
        deficitToken,
        swapAmount,
      )

      quotes.push(quote)
      currentBalance += quote.amountOut

      if (currentBalance >= deficitToken.analysis.targetSlippage.min) break
    }

    return quotes
  }
}
