import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { AAModularAccountService } from './aa-modular-multichain.service'
import { AlchemyService } from './alchemy.service'

import { Module } from '@nestjs/common'

@Module({
  imports: [EcoConfigModule],

  providers: [AlchemyService, AAModularAccountService],

  exports: [AlchemyService, AAModularAccountService],
})
export class AlchemyModule {}
