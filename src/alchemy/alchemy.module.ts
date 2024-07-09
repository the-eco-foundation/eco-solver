import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { AlchemyService } from './alchemy.service'

import { Module } from '@nestjs/common'

@Module({
  imports: [EcoConfigModule],

  providers: [AlchemyService],

  exports: [AlchemyService],
})
export class AlchemyModule {}
