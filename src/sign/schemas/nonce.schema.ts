import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Network } from 'alchemy-sdk'

@Schema()
export class Nonce {
  @Prop({ required: true, unique: true })
  network: Network

  @Prop({ required: true, default: 0 })
  nonce: number
}

export const NonceSchema = SchemaFactory.createForClass(Nonce)
