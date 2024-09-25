import { Injectable } from '@nestjs/common'
import { Chain } from 'viem'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { ViemMultichainClientService } from './viem_multichain_client.service'
import { SimpleAccountClient, SimpleAccountClientConfig } from './smart-wallets/simple-account'
import { getTransport } from '../common/alchemy/utils'
import { EcoError } from '../common/errors/eco-error'
import { createSimpleAccountClient } from './smart-wallets/simple-account/create.simple.account'
import { chains } from '@alchemy/aa-core'
import { SignerService } from '../sign/signer.service'

@Injectable()
export class SimpleAccountClientService extends ViemMultichainClientService<
  SimpleAccountClient,
  SimpleAccountClientConfig
> {
  constructor(
    readonly ecoConfigService: EcoConfigService,
    private readonly signerService: SignerService,
  ) {
    super(ecoConfigService)
  }

  protected override async createInstanceClient(
    configs: SimpleAccountClientConfig,
  ): Promise<SimpleAccountClient> {
    return createSimpleAccountClient(configs)
  }

  protected override async buildChainConfig(
    chain: chains.Chain,
  ): Promise<SimpleAccountClientConfig> {
    const simpleAccountConfig = this.ecoConfigService.getEth().simpleAccount

    if (!simpleAccountConfig) {
      throw EcoError.InvalidSimpleAccountConfig()
    }

    return {
      chain: chain as Chain,
      transport: getTransport(chain, this.apiKey, true),
      simpleAccountAddress: simpleAccountConfig.walletAddr,
      account: this.signerService.getAccount(),
    }
  }
}
