import { Injectable } from '@nestjs/common'
import { Chain } from 'viem'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { SignerService } from '../sign/signer.service'
import { ViemMultichainClientService } from '../common/viem/viem_multichain_client.service'
import {
  SimpleAccountActions,
  SimpleAccountClient,
  SimpleAccountClientConfig,
} from './smart-wallets/simple-account'
import { getTransport } from '../alchemy/utils'
import { EcoError } from '../common/errors/eco-error'
import { createSimpleAccountClient } from './smart-wallets/simple-account/create.simple.account'

@Injectable()
export class SAClientService extends ViemMultichainClientService<
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

  protected override async buildChainConfig(chain: Chain): Promise<SimpleAccountClientConfig> {
    const simpleAccountConfig = this.ecoConfigService.getEth().simpleAccount

    if (!simpleAccountConfig) {
      throw EcoError.InvalidSimpleAccountConfig()
    }
    const client = createSimpleAccountClient({
      chain: chain,
      transport: getTransport(chain, this.apiKey, true),
      simpleAccountAddress: simpleAccountConfig.walletAddr,
      account: this.signerService.getAccount(),
    }) as any

    client.extend(SimpleAccountActions)
    return client
  }
}
