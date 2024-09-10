import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { AASmartAccountService } from './aa-smart-multichain.service'
import { AlchemyService } from './alchemy.service'

import { Module } from '@nestjs/common'

@Module({
  imports: [EcoConfigModule],

  providers: [AlchemyService, AASmartAccountService],

  exports: [AlchemyService, AASmartAccountService],
})
export class AlchemyModule {}
