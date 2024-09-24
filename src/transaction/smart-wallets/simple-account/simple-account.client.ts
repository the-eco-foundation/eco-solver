import {
  encodeFunctionData,
  WalletClient,
  Hex,
  Transport,
  Chain,
  Account,
  RpcSchema,
  Prettify,
  WalletRpcSchema,
  PublicActions,
} from 'viem'
import { SimpleAccountAbi } from '../../../contracts'

export type SimpleAccountClient<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
> = Prettify<
  WalletClient<
    transport,
    chain,
    account,
    rpcSchema extends RpcSchema ? [...WalletRpcSchema, ...rpcSchema] : WalletRpcSchema
  >
  & PublicActions<transport, chain>
  & SimpleAccountActions
  & {
    simpleAccountAddress: Hex
  }
>

export function SimpleAccountActions<
  transport extends Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
>(client: SimpleAccountClient<transport, chain, account>): SimpleAccountActions {
  return {
    execute: (args) => execute(client, args),
  }
}

export type SimpleAccountActions = {
  execute: (args: ExecuteSimpleAccountArgs) => Promise<Hex>
}

type ExecuteSimpleAccountArgs =  { to: Hex; data: Hex; value?: bigint }[] 

async function execute<chain extends Chain | undefined, account extends Account | undefined>(
  client: SimpleAccountClient<Transport, chain, account>,
  transactions: ExecuteSimpleAccountArgs,
): Promise<Hex> {
  if (transactions.length === 1) {
    const [tx] = transactions

    const data = encodeFunctionData({
      abi: SimpleAccountAbi,
      functionName: 'execute',
      args: [tx.to, tx.value, tx.data],
    })

    return client.sendTransaction({
      data: data,
      kzg: undefined,
      to: client.simpleAccountAddress,
      chain: client.chain as Chain,
      account: client.account as Account,
    })
  }

  const data = encodeFunctionData({
    abi: SimpleAccountAbi,
    functionName: 'executeBatch',
    args: [transactions.map((tx) => tx.to), transactions.map((tx) => tx.data)],
  })

  return client.sendTransaction({
    data: data,
    kzg: undefined,
    to: client.simpleAccountAddress,
    chain: client.chain as Chain,
    account: client.account as Account,
  })
}
