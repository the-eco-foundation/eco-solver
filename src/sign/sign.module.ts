import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Nonce, NonceSchema } from './schemas/nonce.schema'
import { NonceService } from './nonce.service'
import { SignerProcessor } from '../bullmq/processors/signer.processor'
import { initBullMQ } from '../bullmq/bullmq.helper'
import { QUEUES } from '../common/redis/constants'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { SignerService } from './signer.service'
import { AtomicSignerService } from './atomic-signer.service'
import { AlchemyModule } from '../alchemy/alchemy.module'

@Module({
  imports: [
    forwardRef(() => AlchemyModule),
    EcoConfigModule,
    MongooseModule.forFeature([{ name: Nonce.name, schema: NonceSchema }]),
    initBullMQ(QUEUES.SIGNER),
  ],
  providers: [NonceService, AtomicSignerService, SignerService, SignerProcessor],
  // controllers: [SignController],
  exports: [
    SignerService,
    // NonceService,
    // AtomicSignerService
  ],
})
export class SignModule {}
