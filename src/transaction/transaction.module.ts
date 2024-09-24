import { Module } from '@nestjs/common'
import { SignModule } from '../sign/sign.module'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { SimpleAccountClientService } from './simple-account-client.service'
import { MultichainPublicClientService } from './multichain-public-client.service'
import { ViemMultichainClientService } from './viem_multichain_client.service'

@Module({
  imports: [EcoConfigModule, SignModule],
  providers: [
    SimpleAccountClientService,
    MultichainPublicClientService,
    ViemMultichainClientService,
  ],
  exports: [SimpleAccountClientService, MultichainPublicClientService],
})
export class TransactionModule {}
