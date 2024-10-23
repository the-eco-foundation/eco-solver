import { Hex, Transport, Chain, Account, RpcSchema, Prettify, WalletRpcSchema } from 'viem'
import { ExecuteSmartWalletArgs, SmartWalletClient } from '../smart-wallet.types'
import { ToEcdsaKernelSmartAccountReturnType } from 'permissionless/accounts'
import { KernelWalletActions } from './kernel-account.config'

export type DeployFactoryArgs = {
  factory?: Hex | undefined
  factoryData?: Hex | undefined
  deployReceipt?: Hex | undefined
  chainID?: number
}

export type KernelAccountClient<
  entryPointVersion extends '0.6' | '0.7',
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
> = Prettify<
  SmartWalletClient<
    transport,
    chain,
    account,
    rpcSchema extends RpcSchema ? [...WalletRpcSchema, ...rpcSchema] : WalletRpcSchema
  > & {
    kernelAccount: ToEcdsaKernelSmartAccountReturnType<entryPointVersion>
  }
>

export function KernelAccountActions<
  entryPointVersion extends '0.6' | '0.7',
  transport extends Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
>(client: KernelAccountClient<entryPointVersion, transport, chain, account>): KernelWalletActions {
  return {
    execute: (args) => execute(client, args),
    deployKernelAccount: () => deployKernelAccount(client),
  }
}

async function execute<
  entryPointVersion extends '0.6' | '0.7',
  chain extends Chain | undefined,
  account extends Account | undefined,
>(
  client: KernelAccountClient<entryPointVersion, Transport, chain, account>,
  transactions: ExecuteSmartWalletArgs,
): Promise<Hex> {
  // encodeFunctionData({
  //   abi: KernelFactoryAbi,
  //   functionName: 'createKernelAccount',
  //   args: [transactions.map((tx) => tx.to), transactions.map((tx) => tx.data)],
  // })
  // const data = encodeFunctionData({
  //   abi: KernelV3ExecuteAbi,
  //   functionName: 'execute',
  //   args: [transactions.map((tx) => tx.to), transactions.map((tx) => tx.data)],
  // })
  return '0x'
}

async function deployKernelAccount<
  entryPointVersion extends '0.6' | '0.7',
  transport extends Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
>(
  client: KernelAccountClient<entryPointVersion, transport, chain, account>,
): Promise<DeployFactoryArgs> {
  const args: DeployFactoryArgs = {}
  if (!(await client.kernelAccount.isDeployed())) {
    const fa = await client.kernelAccount.getFactoryArgs()
    args.factory = fa.factory
    args.factoryData = fa.factoryData
    args.chainID = client.chain?.id
    args.deployReceipt = await client.sendTransaction({
      data: args.factoryData,
      kzg: undefined,
      to: args.factory,
      chain: client.chain as Chain,
      account: client.account as Account,
    })
  }
  return args
}
