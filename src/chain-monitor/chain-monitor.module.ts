import { Module } from '@nestjs/common'
import { EventMonitorService } from './event-monitor.service'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { SourceIntentModel, SourceIntentSchema } from '../intent/schemas/source-intent.schema'
import { MongooseModule } from '@nestjs/mongoose'
import { AlchemyModule } from '../alchemy/alchemy.module'

@Module({
  imports: [
    AlchemyModule,
    EcoConfigModule,
    MongooseModule.forFeature([{ name: SourceIntentModel.name, schema: SourceIntentSchema }]),
  ],
  providers: [EventMonitorService],
  exports: [EventMonitorService],
})
export class ChainMonitorModule {}
