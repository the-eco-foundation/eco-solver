import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { SolverService } from './solver.service'
import { AlchemyModule } from '../alchemy/alchemy.module'

@Module({
  imports: [EcoConfigModule, AlchemyModule],
  providers: [SolverService],
  exports: [],
})
export class SolverModule {}
