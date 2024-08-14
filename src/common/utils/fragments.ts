import { Interface as EthersInterface } from 'ethers'
import { TargetContractType } from '../../eco-configs/eco-config.types'
import { ERC20__factory } from '../../typing/contracts'
import { EcoError } from '../errors/eco-error'

export function getFragment(targetType: TargetContractType): EthersInterface {
  switch (targetType) {
    case 'erc20':
      return ERC20__factory.createInterface()
    case 'erc721':
    case 'erc1155':
    default:
      throw EcoError.SourceIntentUnsupportedTargetType(targetType)
  }
}

export function isSupportedTokenType(targetType: TargetContractType): boolean {
  switch (targetType) {
    case 'erc20':
      return true
    case 'erc721':
    case 'erc1155':
    default:
      throw EcoError.SourceIntentUnsupportedTargetType(targetType)
  }
}
