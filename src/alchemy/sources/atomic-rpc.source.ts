import { NonceManagerSource } from 'viem'
import { getTransactionCount } from 'viem/_types/actions/public/getTransactionCount'
import { LruMap } from 'viem/_types/utils/lru'
import type { Address } from 'abitype'
import { Document, Model, ModifyResult, ObjectId, QueryOptions } from 'mongoose'
import type { Client } from 'viem/_types/clients/createClient'
import { Nonce } from '../../sign/schemas/nonce.schema'

type FunctionParameters = {
  address: Address
  chainId: number
}

type AtomicGetParameters = FunctionParameters & { client: Client }

const getKey = ({ address, chainId }: FunctionParameters) => `${address}.${chainId}`

/** An atomic JSON-RPC source for a nonce manager. It initializes the nonce
 * to the current RPC returned transaction count, then it stores and increments
 * the nonce through an atomic call locally. Ie. a database that can enforce atomicity.
 *
 * This way the account for the nonce can be shared amongs multiple processes simultaneously without
 * the treat of nonce collisions. Such as in a kubernetes cluster.
 */
export function atomicRpc(atom: AtomicGetUpdate): NonceManagerSource {
  const nonceMap = new LruMap<number>(8192)
  return {
    async get(parameters) {
      const { address, chainId, client } = parameters
      const key = getKey({ address, chainId })
      if (!nonceMap.get(key)) {
        //if undefined
        // <--- should we lock this operation for when things start up?
        // <--- what happens if services go down, and tx happens in the background? then they come up?
        // <-- implement AtomicGetUpdate
        // -<<< actually create a service that inits these in the db level in  a Redlock, then pass on
        const nonce = await getTransactionCount(client, {
          address,
          blockTag: 'pending',
        })
        nonceMap.set(key, nonce)
        await atom.set(nonce)
        return nonce
      } else {
        //get and increment from db
        return await atom.getUpdate(parameters)
      }
    },
    async set(parameters, nonce: number) {
      return await atom.set(nonce)
    },
  }
}

export abstract class AtomicNonce<T> implements AtomicGetUpdate {
  constructor(private model: Model<T>) {}

  async getUpdate(parameters: AtomicGetParameters): Promise<number> {
    const query = { key: getKey(parameters) }
    const updates = { $inc: { nonce: 1 } }
    const options: QueryOptions = {
      upsert: true, //creates a new document if one doesn't exist
      new: true, //returns the updated document instead of the document before update
    }
    //get and increment from db
    const updateResponse = await this.model
      .findOneAndUpdate(query, { $set: updates }, options)
      .exec()
    return this.getNonceNum(updateResponse)
  }
  abstract getNonceNum(
    updateResponse: Document<unknown, {}, T> &
      ({ _id: import('mongoose').Types.ObjectId } | Required<{ _id: unknown }>),
  ): number | PromiseLike<number>

  // abstract getNonceNum(model: Document<unknown, {}, T> & ({ _id: ObjectId; } | Required<{ _id: unknown; }>)): number

  // private getNonceNum(doc: Document<unknown, {}, T>): number {
  //   return 1
  // }

  async set(nonce: number): Promise<void> {
    //set in db
  }
}

export interface AtomicGetUpdate {
  getUpdate(parameters: AtomicGetParameters): Promise<number>
  set(nonce: number): Promise<void>
}
