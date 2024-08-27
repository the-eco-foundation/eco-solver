import { LocalAccountSigner } from '@alchemy/aa-core'
import { Hex, PrivateKeyAccount } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { createNonceManager, jsonRpc } from 'viem/nonce'

export function privateKeyAndNonceToAccountSigner(
  key: Hex,
  // @ts-expect-error
): LocalAccountSigner<PrivateKeyAccount> {
  const nonceManager = createNonceManager({
    source: jsonRpc(),
  })
  const signer: PrivateKeyAccount = privateKeyToAccount(key, { nonceManager })

  return new LocalAccountSigner(signer as any)
}
