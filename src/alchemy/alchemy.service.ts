import { Alchemy, Network } from 'alchemy-sdk'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyMultichainClient, AlchemyMultichainSettings } from './alchemy-multichain-client'
import { ethers } from 'ethers'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { EcoError } from '../common/errors/eco-error'
import { AASmartMultichainClient } from './aa-smart-multichain-client'

/**
 * This service provides access to the Alchemy SDK for multiple networks.
 * It initializes the Alchemy SDK with the default network and any additional in the {@link EcoConfigService}.
 */
@Injectable()
export class AlchemyService implements OnModuleInit {
  private logger = new Logger(AlchemyService.name)
  private alchemy: AlchemyMultichainClient
  private _supportedNetworks: Network[] = []
  /**
   * Lazy-loaded mapping of `Network` enum to `Wallet` instance.
   *
   * @private
   */
  private readonly wallets: Map<Network, ethers.Wallet> = new Map()

  constructor(private ecoConfigService: EcoConfigService) {}

  async onModuleInit() {
    const alchemyConfigs = this.ecoConfigService.getAlchemy()
    this._supportedNetworks = this._supportedNetworks.concat(
      alchemyConfigs.networks.map((n) => n.name),
    )
    const apiKey = alchemyConfigs.apiKey
    const configs: Partial<Record<Network, AlchemyMultichainSettings>> =
      alchemyConfigs.networks.reduce((acc, network) => {
        acc[network.name] = { apiKey: apiKey, network: network }
        return acc
      }, {})

    this.alchemy = new AlchemyMultichainClient(configs)
  }

  get supportedNetworks(): ReadonlyArray<Network> {
    return this._supportedNetworks
  }

  getAlchemy(network: Network): Alchemy {
    if (!this.supportedNetworks.includes(network)) {
      throw EcoError.AlchemyUnsupportedNetworkError(network)
    }

    return this.alchemy.forNetwork(network)
  }

  getProvider(network: Network) {
    if (!this.supportedNetworks.includes(network)) {
      throw EcoError.AlchemyUnsupportedNetworkError(network)
    }
    return this.alchemy.providerForNetwork(network)
  }

  getWallet(network: Network): ethers.Wallet {
    if (!this.supportedNetworks.includes(network)) {
      throw EcoError.AlchemyUnsupportedNetworkError(network)
    }

    if (!this.wallets.has(network)) {
      const provider = this.alchemy.providerForNetwork(network)
      const wallet = new ethers.Wallet(this.ecoConfigService.getEth().privateKey, provider)
      this.wallets.set(network, wallet)
    }
    return this.wallets.get(network)
  }
}
