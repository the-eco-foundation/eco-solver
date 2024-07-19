import { Schema, SchemaFactory } from '@nestjs/mongoose'
import { SourceIntentWS } from '../dtos/SourceIntentWS'
import { Network } from 'alchemy-sdk'

@Schema()
export class SourceIntentDataModel implements SourceIntentWS {
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
export const SourceIntentDataSchema = SchemaFactory.createForClass(SourceIntentDataModel)
SourceIntentDataSchema.index({ transactionHash: 1 }, { unique: true })
