import { KernelVersion, ToEcdsaKernelSmartAccountParameters } from 'permissionless/accounts'
import { Hex, Prettify, WalletClientConfig } from 'viem'
import { SmartWalletActions } from '../smart-wallet.types'
import { DeployFactoryArgs } from './kernel-account.client'

export type KernelAccountClientConfig<
  entryPointVersion extends '0.6' | '0.7',
  kernelVersion extends KernelVersion<entryPointVersion>,
> = WalletClientConfig & ToEcdsaKernelSmartAccountParameters<entryPointVersion, kernelVersion>

export type KernelWalletActions = Prettify<
  SmartWalletActions & {
    deployKernelAccount: () => Promise<DeployFactoryArgs>
  }
>

export const isKernelV2 = (version: KernelVersion<'0.6' | '0.7'>): boolean => {
  const regex = /0\.2\.\d+/
  return regex.test(version)
}
