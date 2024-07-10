import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { ProverService } from './prover.service'
import { AlchemyModule } from '../alchemy/alchemy.module'

@Module({
  imports: [EcoConfigModule, AlchemyModule],
  providers: [ProverService],
  exports: [],
})
export class ProverModule {}
