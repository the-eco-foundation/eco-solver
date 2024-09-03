import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { EcoError } from '../common/errors/eco-error'
import { LocalAccountSigner, SmartAccountClient } from '@alchemy/aa-core'
import { AASmartMultichainClient } from './aa-smart-multichain-client'
import { NonceService } from '../sign/nonce.service'
import { privateKeyAndNonceToAccountSigner } from './aa.helper'
import { AtomicNonceService } from '../sign/atomic.nonce.service'


export type AAMultiChainConfig = {
  apiKey: string
  ids: number[]
  signer: LocalAccountSigner<any>
  atom: AtomicNonceService<any>
}
@Injectable()
export class AASmartAccountService implements OnModuleInit {
  private logger = new Logger(AASmartAccountService.name)
  private aa: AASmartMultichainClient
  private _supportedNetworks: number[] = []

  constructor(
    private readonly ecoConfigService: EcoConfigService,
    private readonly atom: NonceService,
  ) {}

  async onModuleInit() {
    const alchemyConfigs = this.ecoConfigService.getAlchemy()
    const ethConfigs = this.ecoConfigService.getEth()
    this._supportedNetworks = this._supportedNetworks.concat(
      alchemyConfigs.networks.map((n) => n.id),
    )
    // const account = privateKeyToAccount(`0x${ethConfigs.privateKey}`)
    // // const manager = createNonceManager({source:})
    // const signer = new LocalAccountSigner(account as PrivateKeyAccount)
    // const signer = LocalAccountSigner.privateKeyToAccountSigner(`0x${ethConfigs.privateKey}`)
    const signer = privateKeyAndNonceToAccountSigner(this.atom, `0x${ethConfigs.privateKey}`)

    const configs: AAMultiChainConfig = {
      apiKey: alchemyConfigs.apiKey,
      ids: alchemyConfigs.networks.map((n) => n.id),
      signer,
      atom: this.atom,
    }

    this.aa = new AASmartMultichainClient(configs)
    await this.atom.initNonce(this)
  }

  get supportedNetworks(): ReadonlyArray<number> {
    return this._supportedNetworks
  }

  async getClient(id: number): Promise<SmartAccountClient> {
    if (!this.supportedNetworks.includes(id)) {
      throw EcoError.AlchemyUnsupportedNetworkIDError(id)
    }
    const a = await (await this.aa.clientForChain(id)).getTransactionCount({address: '0xd6783D1bD6Bf593C975D718041a592f4C908A3ec'})
    console.log(a)
    return await this.aa.clientForChain(id)
  }
}
