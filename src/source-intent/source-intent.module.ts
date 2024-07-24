import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { AlchemyModule } from '../alchemy/alchemy.module'
import { SourceIntentService } from './source-intent.service'
import { SourceIntentWsService } from './source-intent.ws.service'
import { MongooseModule } from '@nestjs/mongoose'
import { initBullMQ } from '../bullmq/bullmq.helper'
import { QUEUES } from '../common/redis/constants'
import { SourceIntentModel, SourceIntentSchema } from './schemas/source-intent.schema'
import { SolveIntentProcessor } from '../bullmq/processors/solve-intent.processor'
import { SourceIntentController } from './source-intent.controller'

@Module({
  imports: [
    EcoConfigModule,
    AlchemyModule,
    MongooseModule.forFeature([{ name: SourceIntentModel.name, schema: SourceIntentSchema }]),
    initBullMQ(QUEUES.SOURCE_INTENT),
  ],
  providers: [SourceIntentService, SourceIntentWsService, SolveIntentProcessor],
  controllers: [SourceIntentController],
  exports: [],
})
export class SolveIntentModule {}
