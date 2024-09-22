import { encodeFunctionData, Hex } from 'viem'
import * as SimpleAccountABI from '../../../assets/abis/SimpleAccount.json'
import { SimpleAccountConfig } from './simple-account-config'

export class SimpleAccount {
  constructor(private readonly config: SimpleAccountConfig) {}

  get smartWalletAddr() {
    return this.config.smartWalletAddr
  }

  get walletClient() {
    return this.config.walletClient
  }

  execute(transactions: { to: Hex; data: Hex; value?: bigint }[]) {
    if (transactions.length === 1) {
      const [tx] = transactions
      const data = encodeFunctionData({
        abi: SimpleAccountABI,
        functionName: 'execute',
        args: [tx.to, tx.value, tx.data],
      })

      return this.walletClient.sendTransaction({
        data: data,
        kzg: undefined,
        to: this.smartWalletAddr,
        chain: this.walletClient.chain,
        account: this.walletClient.account,
      })
    }

    const data = encodeFunctionData({
      abi: SimpleAccountABI,
      functionName: 'executeBatch',
      args: [transactions.map((tx) => tx.to), transactions.map((tx) => tx.data)],
    })

    return this.walletClient.sendTransaction({
      data: data,
      kzg: undefined,
      to: this.smartWalletAddr,
      chain: this.walletClient.chain,
      account: this.walletClient.account,
    })
  }
}
