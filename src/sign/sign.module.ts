import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Nonce, NonceSchema } from './schemas/nonce.schema'
import { NonceService } from './nonce.service'
import { SignerProcessor } from '../bullmq/processors/signer.processor'
import { NonceMeta, NonceMetaSchema } from './schemas/nonce_meta.schema'
import { initBullMQ } from '../bullmq/bullmq.helper'
import { QUEUES } from '../common/redis/constants'
import { EcoConfigModule } from '../eco-configs/eco-config.module'

@Module({
  imports: [
    EcoConfigModule,
    MongooseModule.forFeature([
      { name: Nonce.name, schema: NonceSchema },
      { name: NonceMeta.name, schema: NonceMetaSchema },
    ]),
    initBullMQ(QUEUES.SIGNER),
  ],
  providers: [NonceService, SignerProcessor],
  
  exports: [NonceService],
})
export class SignModule { }
