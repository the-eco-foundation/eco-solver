import { Schema, SchemaFactory } from '@nestjs/mongoose'
import { IntentStruct } from '../../typing/contracts/IntentSource'
import { AddressLike, BigNumberish, BytesLike } from 'ethers'

@Schema()
export class SourceIntentDataModel implements IntentStruct {
  hash: BytesLike
  creator: AddressLike
  destinationChain: BigNumberish
  targets: AddressLike[]
  data: BytesLike[]
  rewardTokens: AddressLike[]
  rewardAmounts: BigNumberish[]
  expiryTime: BigNumberish
  hasBeenWithdrawn: boolean
  nonce: BytesLike

  constructor(
    hash: BytesLike,
    creator: AddressLike,
    destinationChain: BigNumberish,
    targets: AddressLike[],
    data: BytesLike[],
    rewardTokens: AddressLike[],
    rewardAmounts: BigNumberish[],
    expiryTime: BigNumberish,
    nonce: BytesLike,
  ) {
    this.hash = hash
    this.creator = creator
    this.destinationChain = destinationChain
    this.targets = targets
    this.data = data
    this.rewardTokens = rewardTokens
    this.rewardAmounts = rewardAmounts
    this.expiryTime = expiryTime
    this.hasBeenWithdrawn = false
    this.nonce = nonce
  }

  static fromEvent(event: Array<any>): SourceIntentDataModel {
    return new SourceIntentDataModel(
      event[0],
      event[1],
      event[2],
      event[3],
      event[4],
      event[5],
      event[6],
      event[7],
      event[8],
    )
  }
}
export const SourceIntentDataSchema = SchemaFactory.createForClass(SourceIntentDataModel)
SourceIntentDataSchema.index({ hash: 1 }, { unique: true })
SourceIntentDataSchema.index(
  { hasBeenWithdrawn: 1, destinationChain: 'ascending', expiryTime: 'ascending' },
  { unique: false },
)
