import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { EcoConfigService } from '../eco-configs/eco-config.service'

// import { AASmartAccountService } from './aa-smart-multichain.service'
import { AlchemyService } from './alchemy.service'
import { AASmartAccountService } from './aa-smart-multichain.service'
import { SignModule } from '../sign/sign.module'



@Module({
  imports: [
    EcoConfigModule,
    SignModule
  ],

  providers: [AlchemyService, AASmartAccountService],

  exports: [AlchemyService, AASmartAccountService],
})
export class AlchemyModule {}
