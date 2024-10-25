import { Module } from '@nestjs/common'
import { initBullMQ } from '../bullmq/bullmq.helper'
import { QUEUES } from '../common/redis/constants'
import { SourceIntentModel, SourceIntentSchema } from './schemas/source-intent.schema'
import { ValidateIntentService } from './validate-intent.service'
import { FeasableIntentService } from './feasable-intent.service'
import { CreateIntentService } from './create-intent.service'
import { WatchIntentService } from './watch-intent.service'
import { UtilsIntentService } from './utils-intent.service'
import { BalanceModule } from '../balance/balance.module'
import { FulfillIntentService } from './fulfill-intent.service'
import { ProverModule } from '../prover/prover.module'
import { TransactionModule } from '../transaction/transaction.module'
import { MongooseModule } from '@nestjs/mongoose'
import { SolverModule } from '../solver/solver.module'

@Module({
  imports: [
    BalanceModule,
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
    WatchIntentService,
    FulfillIntentService,
    UtilsIntentService,
  ],
  // controllers: [SourceIntentController],
  exports: [
    WatchIntentService,
    CreateIntentService,
    ValidateIntentService,
    FeasableIntentService,
    FulfillIntentService,
    MongooseModule, //add SourceIntentModel to the rest of the modules that import intents
  ],
})
export class IntentModule {}
