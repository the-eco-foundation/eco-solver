import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { SourceIntentEventModel } from './source-intent-event.schema'
import { SourceIntentDataModel } from './source-intent-data.schema'
import { GetTransactionReceiptReturnType } from 'viem'

export type SourceIntentStatus =
  | 'PENDING'
  | 'SOLVED'
  | 'EXPIRED'
  | 'FAILED'
  | 'INVALID'
  | 'INFEASABLE'
  | 'NON-BEND-WALLET'

@Schema({ timestamps: true })
export class SourceIntentModel {
  @Prop({ required: true })
  event: SourceIntentEventModel

  @Prop({ required: true })
  intent: SourceIntentDataModel

  @Prop({ type: Object })
  receipt: GetTransactionReceiptReturnType

  @Prop({ required: true })
  status: SourceIntentStatus
}

export const SourceIntentSchema = SchemaFactory.createForClass(SourceIntentModel)

// Set collation options for case-insensitive search.
SourceIntentSchema.index({ status: 1 }, { unique: false })
