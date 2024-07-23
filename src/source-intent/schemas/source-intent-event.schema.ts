import { Schema, SchemaFactory } from '@nestjs/mongoose'
import { SourceIntentWS } from '../dtos/SourceIntentWS'
import { Network } from 'alchemy-sdk'

@Schema()
export class SourceIntentEventModel implements SourceIntentWS {
  blockNumber: number
  blockHash: string
  transactionIndex: number
  removed: boolean
  address: string
  network: Network
  data: string
  topics: string[]
  transactionHash: string
  logIndex: number
}
export const SourceIntentEventSchema = SchemaFactory.createForClass(SourceIntentEventModel)
SourceIntentEventSchema.index({ transactionHash: 1 }, { unique: true })
