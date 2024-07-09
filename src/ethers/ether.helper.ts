import { Network as EthersNetwork } from 'ethers'
import { Network as AlchemyNetwork } from 'alchemy-sdk'

/**
 * Maps an alchemy network to ethers network given their slightly different naming convention that results in errors
 * when trying to create ethers providers.
 *
 * Ethers has no type mapping, so we have to do it manually from here https://github.com/ethers-io/ethers.js/blob/main/src.ts/providers/network.ts#L385
 *
 * @param alchemy the name of the alchemy network
 * @returns
 */
export function alchemyToEthers(alchemy: AlchemyNetwork): EthersNetwork {
  switch (alchemy) {
    case AlchemyNetwork.OPT_GOERLI:
      return EthersNetwork.from('optimism-goerli')
    case AlchemyNetwork.OPT_SEPOLIA:
      return EthersNetwork.from('optimism-sepolia')
    case AlchemyNetwork.OPT_MAINNET:
      return EthersNetwork.from('optimism')
    case AlchemyNetwork.BASE_GOERLI:
      return EthersNetwork.from('base-goerli')
    case AlchemyNetwork.BASE_SEPOLIA:
      return EthersNetwork.from('base-sepolia')
    case AlchemyNetwork.BASE_MAINNET:
      return EthersNetwork.from('base')
    case AlchemyNetwork.ETH_GOERLI:
      return EthersNetwork.from('goerli')
    case AlchemyNetwork.ETH_SEPOLIA:
      return EthersNetwork.from('sepolia')
    case AlchemyNetwork.ETH_MAINNET:
      return EthersNetwork.from('mainnet')
    default:
      throw new Error('Not supported alchemy network in ethers')
  }
}
