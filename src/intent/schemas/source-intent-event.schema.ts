import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Network } from 'alchemy-sdk'
import { ViemEventLog } from '../../common/events/viem'
import { Hex } from 'viem'

@Schema()
export class SourceIntentEventModel implements ViemEventLog {
  @Prop({ required: true })
  sourceChainID: number
  @Prop({ required: true })
  sourceNetwork: Network
  @Prop({ required: true, type: BigInt })
  blockNumber: bigint
  @Prop({ required: true, type: String })
  blockHash: Hex
  @Prop({ required: true })
  transactionIndex: number
  @Prop({ required: true })
  removed: boolean
  @Prop({ required: true, type: String })
  address: Hex
  @Prop({ required: true })
  data: Hex
  @Prop({ required: true })
  topics: [] | [Hex, ...Hex[]]
  @Prop({ required: true })
  transactionHash: Hex
  @Prop({ required: true })
  logIndex: number
}
export const SourceIntentEventSchema = SchemaFactory.createForClass(SourceIntentEventModel)
SourceIntentEventSchema.index({ transactionHash: 1 }, { unique: true })
