import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Network } from 'alchemy-sdk'
import { EventLogWS } from '../../common/events/websocket'

@Schema()
export class SourceIntentEventModel implements EventLogWS {
  @Prop({ required: true })
  sourceChainID: number
  @Prop({ required: true })
  sourceNetwork: Network
  @Prop({ required: true })
  blockNumber: number
  @Prop({ required: true })
  blockHash: string
  @Prop({ required: true })
  transactionIndex: number
  @Prop({ required: true })
  removed: boolean
  @Prop({ required: true, type: String, lowercase: true })
  address: string
  @Prop({ required: true })
  data: string
  @Prop({ required: true })
  topics: string[]
  @Prop({ required: true })
  transactionHash: string
  @Prop({ required: true })
  logIndex: number
}
export const SourceIntentEventSchema = SchemaFactory.createForClass(SourceIntentEventModel)
SourceIntentEventSchema.index({ transactionHash: 1 }, { unique: true })
