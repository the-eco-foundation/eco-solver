import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ethers } from 'ethers'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { EcoError } from '../common/errors/eco-error'
import { AAModularMultichainClient } from './aa-modular-multichain-client'
import { LocalAccountSigner } from '@alchemy/aa-core'
import { AlchemySmartAccountClient } from '@alchemy/aa-alchemy'


@Injectable()
export class AAModularAccountService implements OnModuleInit {
  private logger = new Logger(AAModularAccountService.name)
  private aa: AAModularMultichainClient
  private _supportedNetworks: number[] = []
  /**
   * Lazy-loaded mapping of `Network` enum to `Wallet` instance.
   *
   * @private
   */
  private readonly wallets: Map<number, ethers.Wallet> = new Map()

  constructor(private ecoConfigService: EcoConfigService) {}

  async onModuleInit() {
    const alchemyConfigs = this.ecoConfigService.getAlchemy()
    const ethConfigs = this.ecoConfigService.getEth()
    this._supportedNetworks = this._supportedNetworks.concat(
      alchemyConfigs.networks.map((n) => n.id),
    )
    const apiKey = alchemyConfigs.apiKey
    const signer = LocalAccountSigner.privateKeyToAccountSigner(`0x${ethConfigs.privateKey}`)
    const configs = alchemyConfigs.networks.reduce((acc, network) => {
      acc[network.id] = { apiKey: apiKey, chain: network.id, signer }
      return acc
    }, {})

    this.aa = new AAModularMultichainClient(configs)
  }

  get supportedNetworks(): ReadonlyArray<number> {
    return this._supportedNetworks
  }

  async getClient(id: number): Promise<AlchemySmartAccountClient> {
    if (!this.supportedNetworks.includes(id)) {
      throw EcoError.AlchemyUnsupportedNetworkIDError(id)
    }

    return await this.aa.clientForChain(id)
  }
}
