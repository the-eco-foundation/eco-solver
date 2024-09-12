import { Injectable } from '@nestjs/common'
import { createPublicClient, PublicClient, PublicClientConfig } from 'viem'
import { ViemMultichainClientService } from './viem_multichain_client.service'

@Injectable()
export class MultichainPublicClientService extends ViemMultichainClientService<
  PublicClient,
  PublicClientConfig
> {
  protected override async createInstanceClient(
    configs: PublicClientConfig,
  ): Promise<PublicClient> {
    //@ts-expect-error client mismatch on property definition
    return createPublicClient(configs)
  }
}