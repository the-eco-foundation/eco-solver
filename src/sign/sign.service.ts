import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Nonce } from './schemas/nonce.schema'
import { Network } from 'ethers'
import { RedlockService } from '../nest-redlock/nest-redlock.service'

@Injectable()
export class NonceService {
  constructor(
    @InjectModel(Nonce.name) private nonceModel: Model<Nonce>,
    private redlockService: RedlockService,
  ) {
    // const a : NonPayableOverrides - >> import { NonPayableOverrides } from '../typing/contracts/common'
    //https://docs.alchemy.com/docs/1-execute-a-user-operation
  }

  async getNextNonceValue(network: Network): Promise<number> {
    this.redlockService.acquireLock([network.name], 5000, { retryCount: 3 })
    const nonceModel = await this.nonceModel
      .findOneAndUpdate({ network }, { $inc: { nonce: 1 } }, { new: true, upsert: true })
      .exec()

    return nonceModel.nonce
  }
}
