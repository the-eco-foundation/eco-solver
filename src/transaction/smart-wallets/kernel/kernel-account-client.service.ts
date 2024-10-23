import { Injectable, Logger } from '@nestjs/common'
import { ViemMultichainClientService } from '../../viem_multichain_client.service'
import { entryPoint07Address } from 'viem/account-abstraction'
import { EcoConfigService } from '../../../eco-configs/eco-config.service'
import { SignerService } from '../../../sign/signer.service'
import { Chain } from 'viem'
import { KernelAccountClientConfig } from './kernel-account.config'
import { KernelVersion } from 'permissionless/accounts'
import { createKernelAccountClient } from './create.kernel.account'
import { KernelAccountClient } from './kernel-account.client'
import { EcoLogMessage } from '../../../common/logging/eco-log-message'

@Injectable()
export class KernelAccountClientService<
  entryPointVersion extends '0.6' | '0.7',
  kernelVersion extends KernelVersion<entryPointVersion>,
> extends ViemMultichainClientService<
  KernelAccountClient<entryPointVersion>,
  KernelAccountClientConfig<entryPointVersion, kernelVersion>
> {
  private logger = new Logger(KernelAccountClientService.name)

  constructor(
    readonly ecoConfigService: EcoConfigService,
    private readonly signerService: SignerService,
  ) {
    super(ecoConfigService)
  }

  protected override async createInstanceClient(
    configs: KernelAccountClientConfig<entryPointVersion, kernelVersion>,
  ): Promise<KernelAccountClient<entryPointVersion>> {
    const { client, args } = await createKernelAccountClient(configs)
    if (args && args.deployReceipt) {
      this.logger.debug(
        EcoLogMessage.fromDefault({
          message: `Deploying Kernel Account`,
          properties: {
            ...args,
            kernelAccount: client.kernelAccount.address,
          },
        }),
      )
    }
    return client
  }

  protected override async buildChainConfig(
    chain: Chain,
  ): Promise<KernelAccountClientConfig<entryPointVersion, kernelVersion>> {
    const base = await super.buildChainConfig(chain)
    return {
      ...base,
      account: this.signerService.getAccount(),
      entryPoint: {
        address: entryPoint07Address,
        version: '0.7' as entryPointVersion,
      },
      owners: [this.signerService.getAccount()],
      index: 0n, // optional
    }
  }
}
