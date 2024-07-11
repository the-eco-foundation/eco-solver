import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { AlchemyModule } from '../alchemy/alchemy.module'
import { SoucerIntentService } from './source-intent.service'
import { SoucerIntentWsService } from './source-intent.ws.service'

@Module({
  imports: [EcoConfigModule, AlchemyModule],
  providers: [SoucerIntentService, SoucerIntentWsService],
  exports: [],
})
export class SolveIntentModule {}
