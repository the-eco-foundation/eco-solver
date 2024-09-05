import { Injectable } from '@nestjs/common'
import { chains } from '@alchemy/aa-core'
import {
  createSmartAccountClient,
  LocalAccountSigner,
  SmartAccountClient,
  SmartAccountClientConfig,
} from '@alchemy/aa-core'
import { ViemMultichainClientService } from './viem_multichain_client.service'
import { http } from 'viem'
import { getAchemyRPCUrl } from '../common/utils/strings'
import { createMultiOwnerModularAccount } from '@alchemy/aa-accounts'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { NonceService } from '../sign/nonce.service'
import { AtomicSignerService } from '../sign/atomic-signer.service'

@Injectable()
export class MultichainAtomicSmartAccountService extends ViemMultichainClientService<
  SmartAccountClient,
  SmartAccountClientConfig
> {
  constructor(
    private readonly atomicSignerService: AtomicSignerService,
    private readonly nonceService: NonceService,
    readonly ecoConfigService: EcoConfigService,
  ) {
    super(ecoConfigService)
  }

  onModuleInit() {
    super.onModuleInit()
    // const ethConfigs = this.ecoConfigService.getEth()
    // const signer = privateKeyAndNonceToAccountSigner(this.nonceService, `0x${ethConfigs.privateKey}`)
  }

  protected override async createInstanceClient(
    configs: SmartAccountClientConfig,
  ): Promise<SmartAccountClient> {
    return createSmartAccountClient(configs)
  }

  protected override async buildChainConfig(
    chain: chains.Chain,
  ): Promise<SmartAccountClientConfig> {
    const rpcTransport = http(getAchemyRPCUrl(chain, this.apiKey))
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
    return this.atomicSignerService.getSigner()
  }
}
