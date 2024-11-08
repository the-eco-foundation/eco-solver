import { createWalletClient, Hex, publicActions } from 'viem'
import { KernelAccountClientConfig } from './kernel-account.config'
import {
  DeployFactoryArgs,
  KernelAccountActions,
  KernelAccountClient,
} from './kernel-account.client'
import { KernelVersion, toEcdsaKernelSmartAccount } from 'permissionless/accounts'
import { KERNEL_VERSION_TO_ADDRESSES_MAP } from 'permissionless/accounts/kernel/toEcdsaKernelSmartAccount'
import { EntryPointVersion } from 'viem/_types/account-abstraction'

export type entryPointV_0_7 = '0.7'

export async function createKernelAccountClient<
  entryPointVersion extends '0.6' | '0.7' = entryPointV_0_7,
>(
  parameters: KernelAccountClientConfig<entryPointVersion, KernelVersion<entryPointVersion>>,
): Promise<{ client: KernelAccountClient<entryPointVersion>; args: DeployFactoryArgs }> {
  const { key = 'kernelAccountClient', name = 'Kernel Account Client', transport } = parameters
  const { account } = parameters

  let client = createWalletClient({
    ...parameters,
    account,
    key,
    name,
    transport,
  }) as KernelAccountClient<entryPointVersion>

  const kernelAccount = await toEcdsaKernelSmartAccount<
    entryPointVersion,
    KernelVersion<entryPointVersion>
  >({
    ...parameters,
    client,
  })
  kernelAccount.getFactoryArgs = getFactoryArgs(kernelAccount.entryPoint.version)

  client.kernelAccount = kernelAccount
  client.kernelAccountAddress = kernelAccount.address
  client = client.extend(KernelAccountActions).extend(publicActions) as any

  //conditionally deploys kernel account if it doesn't exist
  const args = await client.deployKernelAccount()
  return { client, args }
}

function getFactoryArgs(entryPointVersion: EntryPointVersion): () => Promise<{ factory?: Hex | undefined, factoryData?: Hex | undefined }> {
  return async (): Promise<{ factory?: Hex | undefined, factoryData?: Hex | undefined }> => {
    const kernelVersion = entryPointVersion == '0.6' ? '0.2.4' : '0.3.1'
    const addresses = KERNEL_VERSION_TO_ADDRESSES_MAP[kernelVersion]
    return {
      factory: addresses.FACTORY_ADDRESS,
      factoryData: undefined //kernelAccount.encodeCalls([]),
    }
  }
}

// async function getFactoryArgs(kernelVersion: ): Promise<{ factory?: Hex | undefined, factoryData?: Hex | undefined }> {
//   const kern = KERNEL_VERSION_TO_ADDRESSES_MAP[kernelVersion]
//   return {
//     factory: kern.FACTORY_ADDRESS,
//     factoryData: undefined //kernelAccount.encodeCalls([]),
//   }
// }
