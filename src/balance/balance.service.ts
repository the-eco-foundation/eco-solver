import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { getDestinationNetworkAddressKey } from '../common/utils/strings'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { erc20Abi, Hex } from 'viem'
import { ViemEventLog } from '../common/events/viem'
import { decodeTransferLog, isSupportedTokenType } from '../contracts'
import { KernelAccountClientService } from '../transaction/smart-wallets/kernel/kernel-account-client.service'
import { TokenConfig } from '@/balance/types'

type TokenBalance = { decimals: number; balance: bigint }

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class BalanceService implements OnApplicationBootstrap {
  private logger = new Logger(BalanceService.name)

  private readonly tokenBalances: Map<string, TokenBalance> = new Map()

  constructor(
    private readonly ecoConfig: EcoConfigService,
    private readonly kernelAccountClientService: KernelAccountClientService,
  ) {}

  async onApplicationBootstrap() {
    // iterate over all tokens
    await Promise.all(this.getTokens().map((token) => this.loadTokenBalance(token)))
  }

  /**
   * Get the token balance of the solver
   * @returns
   */
  async getTokenBalance(chainID: number, tokenAddress: Hex) {
    return (
      this.tokenBalances.get(getDestinationNetworkAddressKey(chainID, tokenAddress)) ?? {
        balance: 0n,
        decimals: 0n,
      }
    )
  }

  /**
   * Updates the token balance of the solver, called from {@link EthWebsocketProcessor}
   * @returns
   */
  updateBalance(balanceEvent: ViemEventLog) {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `updateBalance ${balanceEvent.transactionHash}`,
        properties: {
          intentHash: balanceEvent.transactionHash,
        },
      }),
    )

    const intent = decodeTransferLog(balanceEvent.data, balanceEvent.topics)
    const key = getDestinationNetworkAddressKey(balanceEvent.sourceChainID, balanceEvent.address)
    const balanceObj = this.tokenBalances.get(key)
    if (balanceObj) {
      balanceObj.balance = balanceObj.balance + intent.args.value
    }
  }

  getTokens(): TokenConfig[] {
    return Object.values(this.ecoConfig.getSolvers()).flatMap((solver) => {
      return Object.entries(solver.targets)
        .filter(([, targetContract]) => isSupportedTokenType(targetContract.contractType))
        .map(([tokenAddress, targetContract]) => ({
          address: tokenAddress as Hex,
          chainId: solver.chainID,
          type: targetContract.contractType,
          minBalance: targetContract.minBalance,
        }))
    })
  }

  /**
   * Loads the token balance of the solver
   * @returns
   */
  private async loadTokenBalance(token: TokenConfig) {
    switch (token.type) {
      case 'erc20':
        return this.loadERC20TokenBalance(token.chainId, token.address)
      default:
        throw new Error('Unsupported token type')
    }
  }

  private async loadERC20TokenBalance(
    chainID: number,
    tokenAddress: Hex,
  ): Promise<TokenBalance | undefined> {
    const key = getDestinationNetworkAddressKey(chainID, tokenAddress)
    if (!this.tokenBalances.has(key)) {
      const client = await this.kernelAccountClientService.getClient(chainID)
      const erc20 = {
        address: tokenAddress,
        abi: erc20Abi,
      }

      const [{ result: balance }, { result: decimals }] = await client.multicall({
        contracts: [
          {
            ...erc20,
            functionName: 'balanceOf',
            args: [client.kernelAccount.address],
          },
          {
            ...erc20,
            functionName: 'decimals',
          },
        ],
      })

      this.tokenBalances.set(key, { balance: balance ?? 0n, decimals: decimals ?? 0 })
    }
    return this.tokenBalances.get(key)
  }

  private async fetchTokenBalances(chainID: number, tokenAddress: Hex): Promise<TokenBalance> {
    const client = await this.kernelAccountClientService.getClient(chainID)
    const erc20 = { address: tokenAddress, abi: erc20Abi }

    const [{ result: balance = 0n }, { result: decimals = 0 }] = await client.multicall({
      contracts: [
        {
          ...erc20,
          functionName: 'balanceOf',
          args: [client.kernelAccount.address],
        },
        {
          ...erc20,
          functionName: 'decimals',
        },
      ],
    })

    return { balance, decimals }
  }
}
