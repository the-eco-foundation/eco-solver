export const ProverAbi = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'chainId',
            type: 'uint256',
          },
          {
            components: [
              {
                internalType: 'uint8',
                name: 'provingMechanism',
                type: 'uint8',
              },
              {
                internalType: 'uint256',
                name: 'settlementChainId',
                type: 'uint256',
              },
              {
                internalType: 'address',
                name: 'settlementContract',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'blockhashOracle',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'outputRootVersionNumber',
                type: 'uint256',
              },
            ],
            internalType: 'struct Prover.ChainConfiguration',
            name: 'chainConfiguration',
            type: 'tuple',
          },
        ],
        internalType: 'struct Prover.ChainConfigurationConstructor[]',
        name: '_chainConfigurations',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_inputBlockNumber',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_latestBlockNumber',
        type: 'uint256',
      },
    ],
    name: 'OutdatedBlock',
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
        internalType: 'address',
        name: '_claimant',
        type: 'address',
      },
    ],
    name: 'IntentProven',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_blockNumber',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: '_L1WorldStateRoot',
        type: 'bytes32',
      },
    ],
    name: 'L1WorldStateProven',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_destinationChainID',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_blockNumber',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: '_L2WorldStateRoot',
        type: 'bytes32',
      },
    ],
    name: 'L2WorldStateProven',
    type: 'event',
  },
  {
    inputs: [],
    name: 'L2_DISPUTE_GAME_FACTORY_LIST_SLOT_NUMBER',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'L2_FAULT_DISPUTE_GAME_ROOT_CLAIM_SLOT',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'L2_FAULT_DISPUTE_GAME_STATUS_SLOT',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'L2_OUTPUT_ROOT_VERSION_NUMBER',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'L2_OUTPUT_SLOT_NUMBER',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'PROOF_TYPE',
    outputs: [
      {
        internalType: 'enum IProver.ProofType',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'createdAt',
        type: 'uint64',
      },
      {
        internalType: 'uint64',
        name: 'resolvedAt',
        type: 'uint64',
      },
      {
        internalType: 'uint8',
        name: 'gameStatus',
        type: 'uint8',
      },
      {
        internalType: 'bool',
        name: 'initialized',
        type: 'bool',
      },
      {
        internalType: 'bool',
        name: 'l2BlockNumberChallenged',
        type: 'bool',
      },
    ],
    name: 'assembleGameStatusStorage',
    outputs: [
      {
        internalType: 'bytes',
        name: 'gameStatusStorageSlotRLP',
        type: 'bytes',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'chainConfigurations',
    outputs: [
      {
        internalType: 'uint8',
        name: 'provingMechanism',
        type: 'uint8',
      },
      {
        internalType: 'uint256',
        name: 'settlementChainId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'settlementContract',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'blockhashOracle',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'outputRootVersionNumber',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'rootClaim',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'faultDisputeGameProxyAddress',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'faultDisputeGameStateRoot',
            type: 'bytes32',
          },
          {
            internalType: 'bytes[]',
            name: 'faultDisputeGameRootClaimStorageProof',
            type: 'bytes[]',
          },
          {
            components: [
              {
                internalType: 'uint64',
                name: 'createdAt',
                type: 'uint64',
              },
              {
                internalType: 'uint64',
                name: 'resolvedAt',
                type: 'uint64',
              },
              {
                internalType: 'uint8',
                name: 'gameStatus',
                type: 'uint8',
              },
              {
                internalType: 'bool',
                name: 'initialized',
                type: 'bool',
              },
              {
                internalType: 'bool',
                name: 'l2BlockNumberChallenged',
                type: 'bool',
              },
            ],
            internalType: 'struct Prover.FaultDisputeGameStatusSlotData',
            name: 'faultDisputeGameStatusSlotData',
            type: 'tuple',
          },
          {
            internalType: 'bytes[]',
            name: 'faultDisputeGameStatusStorageProof',
            type: 'bytes[]',
          },
          {
            internalType: 'bytes',
            name: 'rlpEncodedFaultDisputeGameData',
            type: 'bytes',
          },
          {
            internalType: 'bytes[]',
            name: 'faultDisputeGameAccountProof',
            type: 'bytes[]',
          },
        ],
        internalType: 'struct Prover.FaultDisputeGameProofData',
        name: 'faultDisputeGameProofData',
        type: 'tuple',
      },
      {
        internalType: 'bytes32',
        name: 'l1WorldStateRoot',
        type: 'bytes32',
      },
    ],
    name: 'faultDisputeGameIsResolved',
    outputs: [],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'version',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: 'worldStateRoot',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'messagePasserStateRoot',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'latestBlockHash',
        type: 'bytes32',
      },
    ],
    name: 'generateOutputRoot',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
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
  {
    inputs: [],
    name: 'l1BlockhashOracle',
    outputs: [
      {
        internalType: 'contract IL1Block',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint32',
        name: '_gameType',
        type: 'uint32',
      },
      {
        internalType: 'uint64',
        name: '_timestamp',
        type: 'uint64',
      },
      {
        internalType: 'address',
        name: '_gameProxy',
        type: 'address',
      },
    ],
    name: 'pack',
    outputs: [
      {
        internalType: 'bytes32',
        name: 'gameId_',
        type: 'bytes32',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: '_address',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes',
      },
      {
        internalType: 'bytes[]',
        name: '_proof',
        type: 'bytes[]',
      },
      {
        internalType: 'bytes32',
        name: '_root',
        type: 'bytes32',
      },
    ],
    name: 'proveAccount',
    outputs: [],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'chainId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'claimant',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'inboxContract',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'intermediateHash',
        type: 'bytes32',
      },
      {
        internalType: 'bytes[]',
        name: 'l2StorageProof',
        type: 'bytes[]',
      },
      {
        internalType: 'bytes',
        name: 'rlpEncodedInboxData',
        type: 'bytes',
      },
      {
        internalType: 'bytes[]',
        name: 'l2AccountProof',
        type: 'bytes[]',
      },
      {
        internalType: 'bytes32',
        name: 'l2WorldStateRoot',
        type: 'bytes32',
      },
    ],
    name: 'proveIntent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'rlpEncodedBlockData',
        type: 'bytes',
      },
    ],
    name: 'proveSettlementLayerState',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: '_key',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: '_val',
        type: 'bytes',
      },
      {
        internalType: 'bytes[]',
        name: '_proof',
        type: 'bytes[]',
      },
      {
        internalType: 'bytes32',
        name: '_root',
        type: 'bytes32',
      },
    ],
    name: 'proveStorage',
    outputs: [],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'chainId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'rlpEncodedBlockData',
        type: 'bytes',
      },
      {
        internalType: 'bytes32',
        name: 'l2WorldStateRoot',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'l2MessagePasserStateRoot',
        type: 'bytes32',
      },
      {
        internalType: 'uint256',
        name: 'l2OutputIndex',
        type: 'uint256',
      },
      {
        internalType: 'bytes[]',
        name: 'l1StorageProof',
        type: 'bytes[]',
      },
      {
        internalType: 'bytes',
        name: 'rlpEncodedOutputOracleData',
        type: 'bytes',
      },
      {
        internalType: 'bytes[]',
        name: 'l1AccountProof',
        type: 'bytes[]',
      },
      {
        internalType: 'bytes32',
        name: 'l1WorldStateRoot',
        type: 'bytes32',
      },
    ],
    name: 'proveWorldStateBedrock',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'chainId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'rlpEncodedBlockData',
        type: 'bytes',
      },
      {
        internalType: 'bytes32',
        name: 'l2WorldStateRoot',
        type: 'bytes32',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'messagePasserStateRoot',
            type: 'bytes32',
          },
          {
            internalType: 'bytes32',
            name: 'latestBlockHash',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'gameIndex',
            type: 'uint256',
          },
          {
            internalType: 'bytes32',
            name: 'gameId',
            type: 'bytes32',
          },
          {
            internalType: 'bytes[]',
            name: 'disputeFaultGameStorageProof',
            type: 'bytes[]',
          },
          {
            internalType: 'bytes',
            name: 'rlpEncodedDisputeGameFactoryData',
            type: 'bytes',
          },
          {
            internalType: 'bytes[]',
            name: 'disputeGameFactoryAccountProof',
            type: 'bytes[]',
          },
        ],
        internalType: 'struct Prover.DisputeGameFactoryProofData',
        name: 'disputeGameFactoryProofData',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'faultDisputeGameStateRoot',
            type: 'bytes32',
          },
          {
            internalType: 'bytes[]',
            name: 'faultDisputeGameRootClaimStorageProof',
            type: 'bytes[]',
          },
          {
            components: [
              {
                internalType: 'uint64',
                name: 'createdAt',
                type: 'uint64',
              },
              {
                internalType: 'uint64',
                name: 'resolvedAt',
                type: 'uint64',
              },
              {
                internalType: 'uint8',
                name: 'gameStatus',
                type: 'uint8',
              },
              {
                internalType: 'bool',
                name: 'initialized',
                type: 'bool',
              },
              {
                internalType: 'bool',
                name: 'l2BlockNumberChallenged',
                type: 'bool',
              },
            ],
            internalType: 'struct Prover.FaultDisputeGameStatusSlotData',
            name: 'faultDisputeGameStatusSlotData',
            type: 'tuple',
          },
          {
            internalType: 'bytes[]',
            name: 'faultDisputeGameStatusStorageProof',
            type: 'bytes[]',
          },
          {
            internalType: 'bytes',
            name: 'rlpEncodedFaultDisputeGameData',
            type: 'bytes',
          },
          {
            internalType: 'bytes[]',
            name: 'faultDisputeGameAccountProof',
            type: 'bytes[]',
          },
        ],
        internalType: 'struct Prover.FaultDisputeGameProofData',
        name: 'faultDisputeGameProofData',
        type: 'tuple',
      },
      {
        internalType: 'bytes32',
        name: 'l1WorldStateRoot',
        type: 'bytes32',
      },
    ],
    name: 'proveWorldStateCannon',
    outputs: [],
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
    name: 'provenIntents',
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
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'provenStates',
    outputs: [
      {
        internalType: 'uint256',
        name: 'blockNumber',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: 'blockHash',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'stateRoot',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes[]',
        name: 'dataList',
        type: 'bytes[]',
      },
    ],
    name: 'rlpEncodeDataLibList',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_gameId',
        type: 'bytes32',
      },
    ],
    name: 'unpack',
    outputs: [
      {
        internalType: 'uint32',
        name: 'gameType_',
        type: 'uint32',
      },
      {
        internalType: 'uint64',
        name: 'timestamp_',
        type: 'uint64',
      },
      {
        internalType: 'address',
        name: 'gameProxy_',
        type: 'address',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
] as const
