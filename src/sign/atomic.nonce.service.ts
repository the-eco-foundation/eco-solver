import { NonceManagerSource } from 'viem'
import type { Address } from 'abitype'
import { Model, QueryOptions } from 'mongoose'
import type { Client } from 'viem/_types/clients/createClient'
import { SmartAccountClient } from '@alchemy/aa-core'
import { Injectable } from '@nestjs/common'
import { getAtomicNonceKey } from '../common/utils/strings'
import { EcoLogMessage } from '../common/logging/eco-log-message'

export type AtomicKeyParams = {
  address: Address
  chainId: number
}

export type AtomicKeyClientParams = Pick<AtomicKeyParams, 'address'> & {
  client: SmartAccountClient
}

export type AtomicGetParameters = AtomicKeyParams & { client: Client }

/** An atomic JSON-RPC source for a nonce manager. It initializes the nonce
 * to the current RPC returned transaction count, then it stores and increments
 * the nonce through an atomic call locally. Ie. a database that can enforce atomicity.
 *
 * This way the account for the nonce can be shared amongs multiple processes simultaneously without
 * the treat of nonce collisions. Such as in a kubernetes cluster.
 */
// export function atomicRpc(atom: AtomicGetUpdate): NonceManagerSource {
//   const nonceMap = new LruMap<number>(8192)
//   return {
//     async get(parameters) {
//       const { address, chainId, client } = parameters
//       const key = getAtomicNonceKey({ address, chainId })
//       if (!nonceMap.get(key)) {
//         //if undefined
//         // <--- should we lock this operation for when things start up?
//         // <--- what happens if services go down, and tx happens in the background? then they come up?
//         // <-- implement AtomicGetUpdate
//         // -<<< actually create a service that inits these in the db level in  a Redlock, then pass on
//         const nonce = await getTransactionCount(client, {
//           address,
//           blockTag: 'pending',
//         })
//         nonceMap.set(key, nonce)
//         await atom.set(nonce)
//         return nonce
//       } else {
//         //get and increment from db
//         return await atom.getIncNonce(parameters)
//       }
//     },
//     async set(parameters, nonce: number) {
//       return await atom.set(nonce)
//     },
//   }
// }
@Injectable()
export abstract class AtomicNonceService<T extends { nonce: number }>
  implements NonceManagerSource
{
  constructor(protected model: Model<T>) {}

  async syncNonces(): Promise<void> {
    const params: AtomicKeyClientParams[] = await this.getSyncParams()
    if (params.length === 0) {
      return
    }
    const nonceSyncs = params.map(async (param: AtomicKeyClientParams) => {
      const { address, client } = param
      const nonceNum = await client.getTransactionCount({ address, blockTag: 'pending' })
      return {
        nonceNum,
        chainID: client.chain.id,
        address: address,
      }
    })

    try {
      const updatedNonces = await Promise.all(nonceSyncs)
      const updates = updatedNonces.map(async (nonce) => {
        const { address, chainID } = nonce
        const key = getAtomicNonceKey({ address, chainId: chainID })
        const query = { key }
        const updates = { $set: { nonce: nonce.nonceNum, chainID, address } }
        const options = { upsert: true, new: true }
        return this.model.findOneAndUpdate(query, updates, options).exec()
      })

      await Promise.all(updates)
    } catch (e) {
      EcoLogMessage.fromDefault({
        message: `Error syncing nonces`,
        properties: {
          error: e,
        },
      })
    }
  }

  async get(parameters: AtomicGetParameters): Promise<number> {
    return await this.getIncNonce(parameters)
    // const { address, chainId, client } = parameters
    //   const key = getAtomicNonceKey({ address, chainId })
    //   if (!this.nonceMap.get(key)) {
    //     //if undefined
    //     // <--- should we lock this operation for when things start up?
    //     // <--- what happens if services go down, and tx happens in the background? then they come up?
    //     // <-- implement AtomicGetUpdate
    //     // -<<< actually create a service that inits these in the db level in  a Redlock, then pass on
    //     const nonce = await getTransactionCount(client, {
    //       address,
    //       blockTag: 'pending',
    //     })
    //     this.nonceMap.set(key, nonce)
    //     // await this.set(nonce)
    //     return nonce
    //   } else {
    //     //get and increment from db
    //     return await this.getIncNonce(parameters)
    //   }
  }
  async set(params: AtomicGetParameters, nonce: number): Promise<void> {} // eslint-disable-line @typescript-eslint/no-unused-vars

  async getIncNonce(parameters: AtomicGetParameters): Promise<number> {
    const query = { key: getAtomicNonceKey(parameters) }
    const updates = { $inc: { nonce: 1 } }
    const options: QueryOptions = {
      upsert: true, //creates a new document if one doesn't exist
      new: true, //returns the updated document instead of the document before update
    }
    //get and increment from db
    const updateResponse = await this.model
      .findOneAndUpdate(query, { $set: updates }, options)
      .exec()
    return updateResponse.nonce
  }

  protected async getSyncParams(): Promise<AtomicKeyClientParams[]> {
    return []
  }

  async getNonces(): Promise<T[]> {
    return this.model.find().exec()
  }

  static getNonceQueueKey(address: Address, chainId: number): string {
    return `${address}.${chainId}`
  }
}
