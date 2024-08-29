export default {
  aws: {
    region: 'us-east-2',
    secretID: 'eco-solver-secrets-pre-prod',
  },
  redis: {
    jobs: {
      //remove on complete/fail for dev so we can submit the same tx multiple times
      intentJobConfig: {
        removeOnComplete: false,
        removeOnFail: false,
      },
    },
  },
  sourceIntents: [
    {
      network: 'opt-mainnet',
      chainID: 10,
      sourceAddress: '0x8b0A7aEeC5D243d0a21b52Edcd943270c006a590',
      tokens: [
        '0x0b2c639c533813f4aa9d7837caf62653d097ff85', //usdc
        '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', //usdt
        '0x323665443CEf804A3b5206103304BD4872EA4253', //usdv
        '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', //usdce
      ],
    },
    {
      network: 'base-mainnet',
      chainID: 8453,
      sourceAddress: '0x8b0A7aEeC5D243d0a21b52Edcd943270c006a590',
      tokens: [
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', //usdc
        '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', //usdbc
      ],
    },
  ],
  solvers: {
    //base mainnet
    8453: {
      solverAddress: '0xBAD17e5280eF02c82f6aa26eE3d5E77458e53538',
      targets: {
        //base mainnet USDC
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
        },
        //base mainnet USDBC
        '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
        },
      },
      network: 'base-mainnet',
      chainID: 8453,
    },
    //op mainnet
    10: {
      solverAddress: '0xBAD17e5280eF02c82f6aa26eE3d5E77458e53538',
      targets: {
        //op mainnet USDC
        '0x0b2c639c533813f4aa9d7837caf62653d097ff85': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
        },
        //op mainnet USDT
        '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
        },
        //op mainnet USDV
        '0x323665443CEf804A3b5206103304BD4872EA4253': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
        },
        //op mainnet USDCE
        '0x7F5c764cBc14f9669B88837ca1490cCa17c31607': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
        },
      },
      network: 'opt-mainnet',
      chainID: 10,
    },
  },
}
