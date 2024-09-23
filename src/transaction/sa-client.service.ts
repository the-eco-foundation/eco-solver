import { Injectable } from '@nestjs/common'
import { Chain, createWalletClient } from 'viem'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { SignerService } from '../sign/signer.service'
import { privateKeyToAccount } from 'viem/accounts'
import { ViemMultichainClientService } from '../common/viem/viem_multichain_client.service'
import { SimpleAccount, SimpleAccountConfig } from './smart-wallets/simple-account'
import { getTransport } from '../alchemy/utils'
import { EcoError } from '../common/errors/eco-error'

@Injectable()
export class SAClientService extends ViemMultichainClientService<
  SimpleAccount,
  SimpleAccountConfig
> {
  constructor(
    readonly ecoConfigService: EcoConfigService,
    private readonly signerService: SignerService,
  ) {
    super(ecoConfigService)
  }

  protected override async createInstanceClient(
    configs: SimpleAccountConfig,
  ): Promise<SimpleAccount> {
    return new SimpleAccount(configs)
  }

  protected override async buildChainConfig(chain: Chain): Promise<SimpleAccountConfig> {
    const simpleAccountConfig = this.ecoConfigService.getEth().simpleAccount

    if (!simpleAccountConfig) {
      throw EcoError.InvalidSimpleAccountConfig()
    }

    return {
      signerPk: simpleAccountConfig.signerPrivateKey,
      smartWalletAddr: simpleAccountConfig.walletAddr,
      walletClient: createWalletClient({
        chain: chain,
        transport: getTransport(chain, this.apiKey, true),
        account: privateKeyToAccount(this.signerService.getPrivateKey()),
      }) as any,
    }
  }
}
