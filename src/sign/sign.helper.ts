import { LocalAccountSigner } from '@alchemy/aa-core'
import { Hex, NonceManagerSource, PrivateKeyAccount } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { createNonceManager } from 'viem/nonce'
import { AtomicKeyParams } from './atomic.nonce.service'

export function privateKeyAndNonceToAccountSigner(
  atomicNonceSource: NonceManagerSource,
  key: Hex,
  // @ts-expect-error complains on private key
): LocalAccountSigner<PrivateKeyAccount> {
  const nonceManager = createNonceManager({
    source: atomicNonceSource,
  })
  const signer: PrivateKeyAccount = privateKeyToAccount(key, { nonceManager })

  return new LocalAccountSigner(signer as any)
}

export function getAtomicNonceKey(params: AtomicKeyParams) {
  return `${params.address}.${params.chainId}`
}

export function getAtomicNonceVals(key: string): AtomicKeyParams {
  const [address, chainId] = key.split('.')
  return { address: address as Hex, chainId: parseInt(chainId) }
}
