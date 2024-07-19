import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Nonce, NonceSchema } from './schemas/nonce.schema'
import { NonceService } from './sign.service'

@Module({
  imports: [MongooseModule.forFeature([{ name: Nonce.name, schema: NonceSchema }])],
  providers: [NonceService],
  exports: [NonceService],
})
export class SignModule {}
