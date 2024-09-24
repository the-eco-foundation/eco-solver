import { Injectable, Logger } from '@nestjs/common'
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { MultichainSmartAccountService } from '../../alchemy/multichain_smart_account.service'
import { erc20Abi, Hex } from 'viem'
import { Network } from 'alchemy-sdk'

type TokenType = { decimal: number; value: string; minBalances?: number }
@Injectable()
export class BalanceHealthIndicator extends HealthIndicator {
  private logger = new Logger(BalanceHealthIndicator.name)
  constructor(
    private readonly accountService: MultichainSmartAccountService,
    private readonly configService: EcoConfigService,
  ) {
    super()
  }
  async checkBalances(): Promise<HealthIndicatorResult> {
    const [solvers, sources] = await Promise.all([this.getSolvers(), this.getSources()])
    const isHealthy = solvers.every((solver) => {
      const tokens = solver.tokens
      return Object.values(tokens).every((token) => {
        if (!token.minBalances) {
          return true
        }
        const minBalanceDecimal = BigInt(token.minBalances) * BigInt(10 ** token.decimal)
        return BigInt(token.value) >= minBalanceDecimal
      })
    })
    return this.getStatus('balances', isHealthy, { solvers, sources })
  }

  private async getSources(): Promise<any[]> {
    const sources: Array<{
      accountAddress: `0x${string}` | undefined
      tokens: Record<string, TokenType>
      network: Network
      chainID: number
      sourceAddress: Hex
      provers: Hex[]
    }> = []
    const sourceIntents = this.configService.getSourceIntents()
    for (const sourceIntent of sourceIntents) {
      const client = await this.accountService.getClient(sourceIntent.chainID)
      const accountAddress = client.account?.address

      const balances = await this.getBalanceCalls(sourceIntent.chainID, sourceIntent.tokens)

      const sourceBalancesString = this.joinBalance(balances, sourceIntent.tokens)
      sources.push({ ...sourceIntent, accountAddress, tokens: sourceBalancesString })
    }
    sources.reverse()
    return sources
  }

  private async getSolvers(): Promise<{ tokens: Record<string, TokenType> }[]> {
    const solvers: Array<{
      accountAddress: `0x${string}` | undefined
      tokens: Record<string, TokenType>
      solverAddress: Hex
      network: Network
      chainID: number
    }> = []
    const solverConfig = this.configService.getSolvers()
    await Promise.all(
      Object.entries(solverConfig).map(async ([, solver]) => {
        const client = await this.accountService.getClient(solver.chainID)
        const accountAddress = client.account?.address
        const tokens = Object.keys(solver.targets)
        const balances = await this.getBalanceCalls(solver.chainID, tokens)
        const mins = Object.values(solver.targets).map((target) => target.minBalance)
        const sourceBalancesString = this.joinBalance(balances, tokens, mins)

        solvers.push({
          ...solver,
          accountAddress,
          tokens: sourceBalancesString,
        })
      }),
    )
    return solvers
  }

  private async getBalanceCalls(chainID: number, tokens: string[]) {
    const client = await this.accountService.getClient(chainID)
    const accountAddress = client.account?.address

    const balanceCalls = tokens.map((token) => {
      return [
        {
          address: token,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [accountAddress],
        },
        {
          address: token,
          abi: erc20Abi,
          functionName: 'decimals',
        },
      ]
    })

    return await client.multicall({
      //@ts-expect-error client mismatch on property definition
      contracts: balanceCalls.flat(),
    })
  }

  private joinBalance(
    balances: any,
    tokens: string[],
    minBalances: number[] = [],
  ): Record<string, TokenType> {
    let decimal = 0,
      value = BigInt(0),
      i = 0
    const sourceBalancesString: Record<string, TokenType> = {}

    while (
      balances.length > 0 &&
      ([{ result: decimal as unknown }, { result: value as unknown }] = [
        balances.pop(),
        balances.pop(),
      ])
    ) {
      sourceBalancesString[tokens[i]] = {
        decimal,
        value: BigInt(value).toString(),
        ...(minBalances ? { minBalances: minBalances[i] } : {}),
      }
      i++
    }
    return sourceBalancesString
  }
}
