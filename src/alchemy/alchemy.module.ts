import { forwardRef, Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { AlchemyService } from './alchemy.service'
import { MultichainAtomicSmartAccountService } from './multichain-atomic-smart-account.service'
import { SignModule } from '../sign/sign.module'
import { MultichainSmartAccountService } from './multichain_smart_account.service'
import { MultichainPublicClientService } from './multichain-public-client.service'

@Module({
  imports: [EcoConfigModule, forwardRef(() => SignModule)],

  providers: [
    AlchemyService,
    MultichainAtomicSmartAccountService,
    MultichainSmartAccountService,
    MultichainPublicClientService,
  ],

  exports: [
    AlchemyService,
    MultichainAtomicSmartAccountService,
    MultichainSmartAccountService,
    MultichainPublicClientService,
  ],
})
export class AlchemyModule {}
