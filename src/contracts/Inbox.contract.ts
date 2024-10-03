export const InboxAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_owner',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: '_isSolvingPublic',
        type: 'bool',
      },
      {
        internalType: 'address[]',
        name: '_solvers',
        type: 'address[]',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_hash',
        type: 'bytes32',
      },
    ],
    name: 'IntentAlreadyFulfilled',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_addr',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: '_returnData',
        type: 'bytes',
      },
    ],
    name: 'IntentCallFailed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'IntentExpired',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_expectedHash',
        type: 'bytes32',
      },
    ],
    name: 'InvalidHash',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_solver',
        type: 'address',
      },
    ],
    name: 'UnauthorizedSolveAttempt',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: '_hash',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_sourceChainID',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: '_claimant',
        type: 'address',
      },
    ],
    name: 'Fulfillment',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_solver',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'bool',
        name: '_canSolve',
        type: 'bool',
      },
    ],
    name: 'SolverWhitelistChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'SolvingIsPublic',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_solver',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: '_canSolve',
        type: 'bool',
      },
    ],
    name: 'changeSolverWhitelist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_sourceChainID',
        type: 'uint256',
      },
      {
        internalType: 'address[]',
        name: '_targets',
        type: 'address[]',
      },
      {
        internalType: 'bytes[]',
        name: '_data',
        type: 'bytes[]',
      },
      {
        internalType: 'uint256',
        name: '_expiryTime',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: '_nonce',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_claimant',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: '_expectedHash',
        type: 'bytes32',
      },
    ],
    name: 'fulfill',
    outputs: [
      {
        internalType: 'bytes[]',
        name: '',
        type: 'bytes[]',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'fulfilled',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isSolvingPublic',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'makeSolvingPublic',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'solverWhitelist',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
