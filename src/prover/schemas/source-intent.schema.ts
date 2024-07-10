import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { ContractTransactionReceipt } from 'ethers'
import { SourceIntentDataModel } from './source-intent-data.schema'

export type SourceIntentStatus = 'PENDING' | 'SOLVED' | 'EXPIRED'

@Schema()
export class SourceIntentModel {
  @Prop()
  intentData: SourceIntentDataModel

  @Prop()
  receipt: ContractTransactionReceipt

  @Prop({ required: true })
  status: SourceIntentStatus
}

export const SourceIntentSchema = SchemaFactory.createForClass(SourceIntentModel)

// Set collation options for case-insensitive search.
SourceIntentSchema.index({ status: 1 }, { unique: false })
