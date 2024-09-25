import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { MongooseModule } from '@nestjs/mongoose'
import { initBullMQ } from '../bullmq/bullmq.helper'
import { QUEUES } from '../common/redis/constants'
import { SourceIntentModel, SourceIntentSchema } from './schemas/source-intent.schema'
import { SolveIntentProcessor } from '../bullmq/processors/solve-intent.processor'
import { ValidateIntentService } from './validate-intent.service'
import { FeasableIntentService } from './feasable-intent.service'
import { CreateIntentService } from './create-intent.service'
import { WebsocketIntentService } from './websocket-intent.service'
import { UtilsIntentService } from './utils-intent.service'
import { BalanceModule } from '../balance/balance.module'
import { FulfillIntentService } from './fulfill-intent.service'
import { ProverModule } from '../prover/prover.module'
import { TransactionModule } from '../transaction/transaction.module'
import { SourceIntentController } from './intent.controller'

@Module({
  imports: [
    BalanceModule,
    EcoConfigModule,
    MongooseModule.forFeature([{ name: SourceIntentModel.name, schema: SourceIntentSchema }]),
    ProverModule,
    TransactionModule,
    initBullMQ(QUEUES.SOURCE_INTENT),
  ],
  providers: [
    CreateIntentService,
    ValidateIntentService,
    FeasableIntentService,
    WebsocketIntentService,
    FulfillIntentService,
    UtilsIntentService,
    SolveIntentProcessor,
  ],
  controllers: [SourceIntentController],
  exports: [
    WebsocketIntentService,
    CreateIntentService,
    ValidateIntentService,
    FeasableIntentService,
    FulfillIntentService,
    MongooseModule,
  ],
})
export class IntentModule {}
