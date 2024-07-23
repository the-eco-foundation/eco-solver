import { Schema, SchemaFactory } from '@nestjs/mongoose'
import { EventLogWS } from '../dtos/EventLogWS'
import { Network } from 'alchemy-sdk'

@Schema()
export class SourceIntentEventModel implements EventLogWS {
  network: Network
  blockNumber: number
  blockHash: string
  transactionIndex: number
  removed: boolean
  address: string
  data: string
  topics: string[]
  transactionHash: string
  logIndex: number
}
export const SourceIntentEventSchema = SchemaFactory.createForClass(SourceIntentEventModel)
SourceIntentEventSchema.index({ transactionHash: 1 }, { unique: true })
