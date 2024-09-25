import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Nonce, NonceSchema } from './schemas/nonce.schema'
import { initBullMQ } from '../bullmq/bullmq.helper'
import { QUEUES } from '../common/redis/constants'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { SignerService } from './signer.service'
import { AtomicSignerService } from './atomic-signer.service'
import { NonceService } from './nonce.service'

@Module({
  imports: [
    EcoConfigModule,
    MongooseModule.forFeature([{ name: Nonce.name, schema: NonceSchema }]),
    initBullMQ(QUEUES.SIGNER),
  ],
  providers: [SignerService, NonceService, AtomicSignerService],
  exports: [AtomicSignerService, SignerService, NonceService],
})
export class SignModule {}
