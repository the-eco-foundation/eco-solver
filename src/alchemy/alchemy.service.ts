import { Alchemy, Network } from 'alchemy-sdk'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AlchemyMultichainClient, AlchemyMultichainSettings } from './alchemy-multichain-client'
import { ethers } from 'ethers'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { EcoError } from '../common/errors/eco-error'

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
    const alchemyConfigs = this.ecoConfigService.getEth().alchemy
    this._supportedNetworks.push(alchemyConfigs.default.network)
    const authToken = alchemyConfigs.authToken
    const defaultConfig: AlchemyMultichainSettings = { ...alchemyConfigs.default, authToken }

    const overrides: Partial<Record<Network, AlchemyMultichainSettings>> =
      alchemyConfigs.secondary.reduce((acc, config) => {
        acc[config.network] = { apiKey: config.apiKey, network: config.network, authToken }
        this._supportedNetworks.push(config.network)
        return acc
      }, {})

    this.alchemy = new AlchemyMultichainClient(defaultConfig, overrides)
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
