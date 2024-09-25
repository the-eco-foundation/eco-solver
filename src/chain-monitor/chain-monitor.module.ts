import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { SourceIntentModel, SourceIntentSchema } from '../intent/schemas/source-intent.schema'
import { MongooseModule } from '@nestjs/mongoose'
import { IntentModule } from '../intent/intent.module'
import { ChainSyncService } from './chain-sync.service'
import { TransactionModule } from '../transaction/transaction.module'

@Module({
  imports: [
    EcoConfigModule,
    IntentModule,
    MongooseModule.forFeature([{ name: SourceIntentModel.name, schema: SourceIntentSchema }]),
    TransactionModule,
  ],
  providers: [ChainSyncService],
  exports: [ChainSyncService],
})
export class ChainMonitorModule {}
