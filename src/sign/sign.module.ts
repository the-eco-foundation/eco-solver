import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Nonce, NonceSchema } from './schemas/nonce.schema'
import { initBullMQ } from '../bullmq/bullmq.helper'
import { QUEUES } from '../common/redis/constants'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { SignerService } from './signer.service'

@Module({
  imports: [
    // forwardRef(() => AlchemyModule),
    EcoConfigModule,
    MongooseModule.forFeature([{ name: Nonce.name, schema: NonceSchema }]),
    initBullMQ(QUEUES.SIGNER),
  ],
  providers: [
    SignerService,
    // SignerProcessor,
    // NonceService,
    // AtomicSignerService,
  ],
  exports: [SignerService],
})
export class SignModule {}
