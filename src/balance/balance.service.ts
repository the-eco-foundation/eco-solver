import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { AlchemyService } from '../alchemy/alchemy.service'
import { isSupportedTokenType } from '../common/utils/fragments'
import { Solver } from '../eco-configs/eco-config.types'
import { ERC20, ERC20__factory } from '../typing/contracts'
import { Network } from 'alchemy-sdk'
import { getDestinationNetworkAddressKey } from '../common/utils/strings'
import { EventLogWS } from '../common/events/websocket'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { decodeTransferLog } from '../common/utils/ws.helpers'

type TockenBalance = { erc20: ERC20; decimals: bigint; balance: bigint }

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class BalanceService implements OnModuleInit {
  private logger = new Logger(BalanceService.name)

  private readonly tokenBalances: Map<string, TockenBalance> = new Map()

  constructor(
    private readonly ecoConfig: EcoConfigService,
    private readonly alchemyService: AlchemyService,
  ) {}

  async onModuleInit() {
    //iterate over all solvers
    await Promise.all(
      Object.entries(this.ecoConfig.getSolvers()).map(async (entry) => {
        const [_, solver] = entry
        await this.loadTokenBalances(solver)
      }),
    )
  }

  /**
   * Get the token balance of the solver
   * @returns
   */
  async getTokenBalance(network: Network, tokenAddress: string) {
    return this.tokenBalances.get(getDestinationNetworkAddressKey(network, tokenAddress))
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
    const key = getDestinationNetworkAddressKey(balanceEvent.sourceNetwork, balanceEvent.address)
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
          await this.loadERC20TokenBalance(solver.network, tokenAddress)
        }
      }),
    )
  }

  private async loadERC20TokenBalance(
    network: Network,
    tokenAddress: string,
  ): Promise<TockenBalance> {
    const key = getDestinationNetworkAddressKey(network, tokenAddress)
    if (!this.tokenBalances.has(key)) {
      const signer = this.alchemyService.getWallet(network)
      const tokenContract = ERC20__factory.connect(tokenAddress, signer)
      const balance = await tokenContract.balanceOf(signer.address)
      const decimals = await tokenContract.decimals()
      this.tokenBalances.set(key, { erc20: tokenContract, balance, decimals })
    }
    return this.tokenBalances.get(key)
  }
}
