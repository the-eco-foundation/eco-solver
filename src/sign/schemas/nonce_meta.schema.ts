import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { now } from 'mongoose'

@Schema({ timestamps: true })
export class NonceMeta {
  @Prop({ required: true, default: now() })
  createdAt: Date

  @Prop({ required: true, default: now() })
  updatedAt: Date
}

export const NonceMetaSchema = SchemaFactory.createForClass(NonceMeta)
