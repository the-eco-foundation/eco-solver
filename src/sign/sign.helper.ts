import { LocalAccountSigner } from '@alchemy/aa-core'
import { Hex, NonceManagerSource, PrivateKeyAccount } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { createNonceManager } from 'viem/nonce'

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
