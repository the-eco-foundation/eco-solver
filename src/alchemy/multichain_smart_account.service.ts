import { Injectable } from '@nestjs/common'
import { chains } from '@alchemy/aa-core'
import {
  createSmartAccountClient,
  LocalAccountSigner,
  SmartAccountClient,
  SmartAccountClientConfig,
} from '@alchemy/aa-core'
import { ViemMultichainClientService } from './viem_multichain_client.service'
import { createMultiOwnerModularAccount } from '@alchemy/aa-accounts'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { SignerService } from '../sign/signer.service'
import { getTransport } from './utils'

@Injectable()
export class MultichainSmartAccountService extends ViemMultichainClientService<
  SmartAccountClient,
  SmartAccountClientConfig
> {
  constructor(
    private readonly signerService: SignerService,
    readonly ecoConfigService: EcoConfigService,
  ) {
    super(ecoConfigService)
  }

  onModuleInit() {
    super.onModuleInit()
  }

  protected override async createInstanceClient(
    configs: SmartAccountClientConfig,
  ): Promise<SmartAccountClient> {
    return createSmartAccountClient(configs)
  }

  protected override async buildChainConfig(
    chain: chains.Chain,
  ): Promise<SmartAccountClientConfig> {
    const rpcTransport = getTransport(chain, this.apiKey, true)
    return {
      transport: rpcTransport as any,
      chain: chain,
      account: await createMultiOwnerModularAccount({
        transport: rpcTransport as any,
        chain,
        signer: this.getSigner(),
      }),
    }
  }

  private getSigner(): LocalAccountSigner<any> {
    return this.signerService.getSigner()
  }
}
