export default {
  logger: {
    usePino: false,
  },
  database: {
    auth: {
      enabled: false,
      username: '',
      password: '',
      type: '',
    },

    uriPrefix: 'mongodb://',
    uri: 'localhost:27017',
    dbName: 'eco-solver-local',
    enableJournaling: true,
  },
  redis: {
    connection: {
      host: 'localhost',
      port: 6379,
    },
    jobs: {
      //remove on complete/fail for dev so we can submit the same tx multiple times
      intentJobConfig: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    },
  },
  sourceIntents: [
    {
      network: 'opt-sepolia',
      chainID: 11155420,
      sourceAddress: '0x6B79cD3fE2Eccd3a69c52e621a81d26E75983787',
      tokens: [
        '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', //usdc
        '0x8327Db9040811545C13331A453aBe9C7AA1aCDf8',
        '0x368d7C52B0F62228907C133204605a5B11A1dB6d',
        '0x00D2d1162c689179e8bA7a3b936f80A010A0b5CF',
        '0x3328C29843F7c7dfF7381aF54A03C7423431Eaa4',
        '0xd3F4Bef596a04e2be4fbeB17Dd70f02F717c5a6c',
        '0x93551e3F61F8E3EE73DDc096BddbC1ADc52f5A3a',
      ],
      provers: ['0x99b07fF401E2c73826f3043AdaB2ef37e53d4f23'],
    },
  ],
  solvers: {
    //base sepolia
    84532: {
      solverAddress: '0xe547628e5F7AEf5FEd847491b36Bf8bbF30E93E1',
      targets: {
        //base sepolia USDC
        '0xAb1D243b07e99C91dE9E4B80DFc2B07a8332A2f7': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
          minBalance: 1000,
        },
        '0x8bDa9F5C33FBCB04Ea176ea5Bc1f5102e934257f': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
          minBalance: 1000,
        },
        '0x93551e3F61F8E3EE73DDc096BddbC1ADc52f5A3a': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
          minBalance: 1000,
        },
      },
      network: 'base-sepolia',
      chainID: 84532,
    },
    //op sepolia
    11155420: {
      solverAddress: '0x3487f465E285a4eC20a526903f89C74b172fE845', //todo update to real address
      targets: {
        //op sepolia USDC
        '0x5fd84259d66Cd46123540766Be93DFE6D43130D7': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
          minBalance: 1000,
        },
      },
      network: 'opt-sepolia',
      chainID: 11155420,
    },
  },
}
