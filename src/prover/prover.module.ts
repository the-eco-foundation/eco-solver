import { Module } from '@nestjs/common'
import { ProofService } from './proof.service'

@Module({
  imports: [],
  providers: [ProofService],
  exports: [ProofService],
})
export class ProverModule {}
