import { ViemCall } from '../utils'

export const ProverInterfaceAbi = [
  {
    inputs: [],
    name: 'getProofType',
    outputs: [
      {
        internalType: 'enum IProver.ProofType',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
] as const

/**
 * Call type for the getProofType function
 */
export type ProofCall = ViemCall<typeof ProverInterfaceAbi, 'pure'>
