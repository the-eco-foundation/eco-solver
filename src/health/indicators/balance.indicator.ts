import { Injectable, Logger } from '@nestjs/common'
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { BalanceService } from '../../balance/balance.service'
import { MultichainSmartAccountService } from '../../alchemy/multichain_smart_account.service'

@Injectable()
export class BalanceHealthIndicator extends HealthIndicator {
  private logger = new Logger(BalanceHealthIndicator.name)
  constructor(
    private readonly accountService: MultichainSmartAccountService,
    private readonly balanceService: BalanceService,
    private readonly configService: EcoConfigService,
  ) {
    super()
  }
  async checkBalances(): Promise<HealthIndicatorResult> {
    // const sourceBalances: { [key: string]: { token: string, decimals: bigint, balance: bigint }[] } = {}
    // let isHealthy = true
    // const sourceIntents = this.configService.getSourceIntents()
    // for (const sourceIntent of sourceIntents) {
    //   const balanceCalls = sourceIntent.tokens.map(async (token) => {
    //     const balance = await this.publicClient.getBalance(sourceIntent.sourceAddress, token)
    //     return { token, balance }
    //   })
    // }
    // const solvers = this.configService.getSolvers()

    // const balances: { [key: string]: TokenBalance[] } = {}
    // let isHealthy = true
    // const bridgeSources = this.ecoConfigService.getBridgeNetwork().bridgeSources
    // for (const bridge of bridgeSources) {
    //   const key = this.getKey(bridge)
    //   let bridgeBalanceTokens = await this.etherService.getTokenBalance(bridge)
    //   bridgeBalanceTokens = bridgeBalanceTokens.map((token) => {
    //     const minBalance = bridge.tokens.find((token) => token.address === token.address)
    //       ?.minBalance
    //     return { ...token, minBalance }
    //   })
    //   balances[key] = bridgeBalanceTokens

    //   for (const tokenBalance of balances[key]) {
    //     const minBalance = bridge.tokens.find((token) => token.address === tokenBalance.address)
    //       ?.minBalance
    //     if (tokenBalance.balance < minBalance) {
    //       isHealthy = false
    //       break
    //     }
    //   }
    // }
    // const balancesString = JSON.parse(
    //   JSON.stringify(
    //     balances,
    //     (key, value) => (typeof value === 'bigint' ? value.toString() : value), // return everything else unchanged
    //   ),
    // )
    // return this.getStatus('balances', isHealthy, { balances: balancesString })
    return this.getStatus('balances', true, { balances: '5' })
  }

  private getSourceKey(network: string, chainID: number): string {
    return `${network}-${chainID}`
  }
}
