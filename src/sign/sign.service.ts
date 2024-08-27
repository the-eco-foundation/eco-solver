import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Document, Model, ObjectId, QueryOptions } from 'mongoose'
import { Nonce } from './schemas/nonce.schema'
import { Network } from 'ethers'
import { RedlockService } from '../nest-redlock/nest-redlock.service'
import { AtomicNonce } from '../alchemy/sources/atomic-rpc.source'

@Injectable()
export class NonceService extends AtomicNonce<Nonce> {
  constructor(
    @InjectModel(Nonce.name) private nonceModel: Model<Nonce>,
    private redlockService: RedlockService,
  ) {
    super(nonceModel)
  }

  async getNextNonceValue(network: Network): Promise<number> {
    const lock = await this.redlockService.acquireLock([network.name], 5000, { retryCount: 3 })
    if (lock) {
      const query = { key: getKey(parameters) }
      const updates = { $inc: { nonce: 1 } }
      const options: QueryOptions = {
        upsert: true, //creates a new document if one doesn't exist
        new: true, //returns the updated document instead of the document before update
      }
      //get and increment from db
      const updateResponse = await this.nonceModel
        .findOneAndUpdate(query, { $set: updates }, options)
        .exec()
    }
    const nonceModel = await this.nonceModel
      .findOneAndUpdate({ network }, { $inc: { nonce: 1 } }, { new: true, upsert: true })
      .exec()

    return nonceModel.nonce
  }

  getNonceNum(
    model: Document<unknown, {}, Nonce> &
      ({ _id: import('mongoose').Types.ObjectId } | Required<{ _id: unknown }>),
  ): number {
    return model.no
  }
}
