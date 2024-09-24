import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { isSupportedTokenType } from '../common/utils/fragments'
import { Solver } from '../eco-configs/eco-config.types'
import { getDestinationNetworkAddressKey } from '../common/utils/strings'
import { EventLogWS } from '../common/events/websocket'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { decodeTransferLog } from '../common/utils/ws.helpers'
import { erc20Abi, Hex, zeroAddress } from 'viem'
import { MultichainSmartAccountService } from '../alchemy/multichain_smart_account.service'
type TockenBalance = { decimals: bigint; balance: bigint }

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class BalanceService implements OnApplicationBootstrap {
  private logger = new Logger(BalanceService.name)

  private readonly tokenBalances: Map<string, TockenBalance> = new Map()

  constructor(
    private readonly ecoConfig: EcoConfigService,
    private readonly accountService: MultichainSmartAccountService,
  ) {}

  async onApplicationBootstrap() {
    //iterate over all solvers
    await Promise.all(
      Object.entries(this.ecoConfig.getSolvers()).map(async (entry) => {
        const [, solver] = entry
        await this.loadTokenBalances(solver)
      }),
    )
  }

  /**
   * Get the token balance of the solver
   * @returns
   */
  async getTokenBalance(chainID: number, tokenAddress: string) {
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
  updateBalance(balanceEvent: EventLogWS) {
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
      balanceObj.balance = balanceObj.balance + intent[2]
    }
  }

  /**
   * Loads the token balance of the solver
   * @returns
   */
  private async loadTokenBalances(solver: Solver) {
    await Promise.all(
      Object.entries(solver.targets).map(async (target) => {
        const [tokenAddress, targetContract] = target
        if (isSupportedTokenType(targetContract.contractType)) {
          //load the balance in the local mapping
          await this.loadERC20TokenBalance(solver.chainID, tokenAddress as Hex)
        }
      }),
    )
  }

  private async loadERC20TokenBalance(
    chainID: number,
    tokenAddress: Hex,
  ): Promise<TockenBalance | undefined> {
    const key = getDestinationNetworkAddressKey(chainID, tokenAddress)
    if (!this.tokenBalances.has(key)) {
      const client = await this.accountService.getClient(chainID)
      const erc20 = {
        address: tokenAddress,
        abi: erc20Abi,
      }

      const [{ result: balance }, { result: decimals }] = await client.multicall({
        contracts: [
          {
            ...erc20,
            functionName: 'balanceOf',
            args: [client.account?.address ?? zeroAddress],
          },
          {
            ...erc20,
            functionName: 'decimals',
          },
        ],
      })

      this.tokenBalances.set(key, { balance: balance ?? 0n, decimals: BigInt(decimals ?? 0) })
    }
    return this.tokenBalances.get(key)
  }
}
