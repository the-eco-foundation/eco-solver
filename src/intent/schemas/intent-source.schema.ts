import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { IntentSourceEventModel } from './intent-source-event.schema'
import { IntentSourceDataModel } from './intent-source-data.schema'
import { GetTransactionReceiptReturnType } from 'viem'

export type IntentSourceStatus =
  | 'PENDING'
  | 'SOLVED'
  | 'EXPIRED'
  | 'FAILED'
  | 'INVALID'
  | 'INFEASABLE'
  | 'NON-BEND-WALLET'

@Schema({ timestamps: true })
export class IntentSourceModel {
  @Prop({ required: true })
  event: IntentSourceEventModel

  @Prop({ required: true })
  intent: IntentSourceDataModel

  @Prop({ type: Object })
  receipt: GetTransactionReceiptReturnType

  @Prop({ required: true })
  status: IntentSourceStatus
}

export const IntentSourceSchema = SchemaFactory.createForClass(IntentSourceModel)

// Set collation options for case-insensitive search.
IntentSourceSchema.index({ status: 1 }, { unique: false })
