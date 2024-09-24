import { createWalletClient, publicActions } from 'viem'
import { SimpleAccountActions, SimpleAccountClient } from './simple-account.client'
import { SimpleAccountClientConfig } from './simple-account.config'

export function createSimpleAccountClient(
  parameters: SimpleAccountClientConfig,
): SimpleAccountClient {
  const { key = 'simpleAccountClient', name = 'Simple Account Client', transport } = parameters

  let client = createWalletClient({
    ...parameters,
    key,
    name,
    transport,
  }) as SimpleAccountClient
  client = client.extend(SimpleAccountActions).extend(publicActions) as any
  client.simpleAccountAddress = parameters.simpleAccountAddress
  return client
}
