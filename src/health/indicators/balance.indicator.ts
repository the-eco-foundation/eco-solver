import { Injectable, Logger } from '@nestjs/common'
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { erc20Abi, Hex } from 'viem'
import { Network } from 'alchemy-sdk'
import { SimpleAccountClientService } from '../../transaction/simple-account-client.service'
import { entries } from 'lodash'
import { TargetContract } from '../../eco-configs/eco-config.types'

type TokenType = { decimal: number; value: string; minBalances?: number }
@Injectable()
export class BalanceHealthIndicator extends HealthIndicator {
  private logger = new Logger(BalanceHealthIndicator.name)
  constructor(
    private readonly simpleAccountClientService: SimpleAccountClientService,
    private readonly configService: EcoConfigService,
  ) {
    super()
  }
  async checkBalances(): Promise<HealthIndicatorResult> {
    const minEthBalanceWei = this.configService.getEth().simpleAccount.minEthBalanceWei
    const [accounts, solvers, sources] = await Promise.all([
      this.getAccount(),
      this.getSolvers(),
      this.getSources(),
    ])
    let isHealthy = solvers.every((solver) => {
      const tokens = solver.tokens
      return Object.values(tokens).every((token) => {
        if (!token.minBalances) {
          return true
        }
        const minBalanceDecimal = BigInt(token.minBalances) * BigInt(10 ** token.decimal)
        return BigInt(token.value) >= minBalanceDecimal
      })
    })

    isHealthy =
      isHealthy &&
      accounts.every((bal) => {
        return BigInt(bal.balance) > minEthBalanceWei
      })
    const results = this.getStatus('balances', isHealthy, { accounts, solvers, sources })
    if (isHealthy) {
      return results
    }
    throw new HealthCheckError('Balances failed', results)
  }

  private async getAccount(): Promise<any[]> {
    const minEthBalanceWei = this.configService.getEth().simpleAccount.minEthBalanceWei
    const accountBalance: {
      address: `0x${string}`
      chainID: number
      balance: string
      minEthBalanceWei: number
    }[] = []
    const sourceIntents = this.configService.getSourceIntents()
    for (const sourceIntent of sourceIntents) {
      const client = await this.simpleAccountClientService.getClient(sourceIntent.chainID)
      const address = client.account?.address
      if (address) {
        const bal = await client.getBalance({ address })
        accountBalance.push({
          address,
          chainID: sourceIntent.chainID,
          balance: BigInt(bal).toString(),
          minEthBalanceWei,
        })
      }
    }

    return accountBalance.reverse()
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
      const client = await this.simpleAccountClientService.getClient(sourceIntent.chainID)
      const accountAddress = client.simpleAccountAddress

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
        const client = await this.simpleAccountClientService.getClient(solver.chainID)
        const accountAddress = client.simpleAccountAddress
        const tokens = Object.keys(solver.targets) as Hex[]
        const balances = await this.getBalanceCalls(solver.chainID, tokens)
        const mins = Object.values(solver.targets).map((target) => target.minBalance)
        const sourceBalancesString = this.joinBalance(balances, tokens, mins)
        entries(solver.targets).forEach((target) => {
          ;(target[1] as TargetContract & { balance: object }).balance =
            sourceBalancesString[target[0]]
        })

        solvers.push({
          ...solver,
          accountAddress,
          tokens: sourceBalancesString,
        })
      }),
    )
    return solvers
  }

  private async getBalanceCalls(chainID: number, tokens: Hex[]) {
    const client = await this.simpleAccountClientService.getClient(chainID)
    const accountAddress = client.simpleAccountAddress

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
        balances.shift(),
        balances.shift(),
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
