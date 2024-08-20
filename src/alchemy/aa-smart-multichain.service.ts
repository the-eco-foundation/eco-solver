import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { EcoError } from '../common/errors/eco-error'
import { LocalAccountSigner, SmartAccountClient } from '@alchemy/aa-core'
import { AASmartMultichainClient } from './aa-smart-multichain-client'


@Injectable()
export class AASmartAccountService implements OnModuleInit {
  private logger = new Logger(AASmartAccountService.name)
  private aa: AASmartMultichainClient
  private _supportedNetworks: number[] = []

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

    this.aa = new AASmartMultichainClient(configs)
  }

  get supportedNetworks(): ReadonlyArray<number> {
    return this._supportedNetworks
  }

  async getClient(id: number): Promise<SmartAccountClient> {
    if (!this.supportedNetworks.includes(id)) {
      throw EcoError.AlchemyUnsupportedNetworkIDError(id)
    }

    return await this.aa.clientForChain(id)
  }
}