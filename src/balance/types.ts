import { Hex } from 'viem'
import { TargetContractType } from '@/eco-configs/eco-config.types'

export type TokenConfig = {
  address: Hex
  chainId: number
  minBalance: number
  targetBalance: number
  type: TargetContractType
}

export type TokenBalance = {
  address: string
  decimals: number
  balance: bigint
}
