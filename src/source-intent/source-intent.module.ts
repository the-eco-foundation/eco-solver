import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { AlchemyModule } from '../alchemy/alchemy.module'
import { SoucerIntentService } from './source-intent.service'
import { SoucerIntentWsService } from './source-intent.ws.service'
import { MongooseModule } from '@nestjs/mongoose'
import { initBullMQ } from '../bullmq/bullmq.helper'
import { QUEUES } from '../common/redis/constants'
import { SourceIntentModel, SourceIntentSchema } from './schemas/source-intent.schema'

@Module({
  imports: [
    EcoConfigModule,
    AlchemyModule,
    MongooseModule.forFeature([{ name: SourceIntentModel.name, schema: SourceIntentSchema }]),
    initBullMQ(QUEUES.SOLVE_INTENT),
  ],
  providers: [SoucerIntentService, SoucerIntentWsService],
  exports: [],
})
export class SolveIntentModule {}
