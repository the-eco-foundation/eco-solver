import { Chain } from 'viem'
import { ecoTest } from './definitions/eco'
import { helixTest } from './definitions/helix'
import { optimism, optimismSepolia } from './definitions/optimism'
import { base, baseSepolia } from './definitions/base'

/**
 * List of supported chains for the solver that have modified RPC URLs or are defined in the project
 */
export const ChainsSupported: Chain[] = [
  ecoTest,
  helixTest,
  optimism,
  optimismSepolia,
  base,
  baseSepolia,
]
