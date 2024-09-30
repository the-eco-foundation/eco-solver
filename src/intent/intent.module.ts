import { Module } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { initBullMQ } from '../bullmq/bullmq.helper'
import { QUEUES } from '../common/redis/constants'
import { SourceIntentModel, SourceIntentSchema } from './schemas/source-intent.schema'
import { ValidateIntentService } from './validate-intent.service'
import { FeasableIntentService } from './feasable-intent.service'
import { CreateIntentService } from './create-intent.service'
import { WebsocketIntentService } from './websocket-intent.service'
import { UtilsIntentService } from './utils-intent.service'
import { BalanceModule } from '../balance/balance.module'
import { FulfillIntentService } from './fulfill-intent.service'
import { ProverModule } from '../prover/prover.module'
import { TransactionModule } from '../transaction/transaction.module'
import { MongooseModule } from '@nestjs/mongoose'
import { BullModule } from '@nestjs/bullmq'
import { SolverModule } from '../solver/solver.module'

@Module({
  imports: [
    BalanceModule,
    EcoConfigModule,
    MongooseModule.forFeature([{ name: SourceIntentModel.name, schema: SourceIntentSchema }]),
    ProverModule,
    SolverModule,
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
  ],
  // controllers: [SourceIntentController],
  exports: [
    WebsocketIntentService,
    CreateIntentService,
    ValidateIntentService,
    FeasableIntentService,
    FulfillIntentService,
    MongooseModule, //add SourceIntentModel to the rest of the modules that import intents
    BullModule, //add queues to the rest of the modules that import intents
  ],
})
export class IntentModule {}
