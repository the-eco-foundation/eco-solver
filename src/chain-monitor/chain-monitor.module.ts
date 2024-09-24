import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { SourceIntentModel, SourceIntentSchema } from '../intent/schemas/source-intent.schema'
import { MongooseModule } from '@nestjs/mongoose'
import { IntentModule } from '../intent/intent.module'
import { ChainSyncService } from './chain-sync.service'
import { SolveIntentProcessor } from '../bullmq/processors/solve-intent.processor'
import { TransactionModule } from '../transaction/transaction.module'

@Module({
  imports: [
    EcoConfigModule,
    IntentModule,
    MongooseModule.forFeature([{ name: SourceIntentModel.name, schema: SourceIntentSchema }]),
    TransactionModule,
  ],
  providers: [ChainSyncService, SolveIntentProcessor],
  exports: [ChainSyncService],
})
export class ChainMonitorModule {}
