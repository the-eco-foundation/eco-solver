import { Module } from '@nestjs/common'
import { SignModule } from '../sign/sign.module'
import { SimpleAccountClientService } from './smart-wallets/simple-account/simple-account-client.service'
import { MultichainPublicClientService } from './multichain-public-client.service'
import { ViemMultichainClientService } from './viem_multichain_client.service'
import { KernelAccountClientService } from './smart-wallets/kernel/kernel-account-client.service'

@Module({
  imports: [SignModule],
  providers: [
    SimpleAccountClientService,
    MultichainPublicClientService,
    ViemMultichainClientService,
    KernelAccountClientService,
  ],
  exports: [SimpleAccountClientService, MultichainPublicClientService, KernelAccountClientService],
})
export class TransactionModule {}
