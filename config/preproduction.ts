export default {
  aws: {
    region: 'us-east-2',
    secretID: 'eco-solver-secrets-pre-prod',
  },
  redis: {
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
      network: 'opt-mainnet',
      chainID: 10,
      sourceAddress: '0x532BA2D408e77B773b1d05Dafa5E4A2392e5ED11',
      tokens: [
        '0x0b2c639c533813f4aa9d7837caf62653d097ff85', //usdc
      ],
    },
  ],
  solvers: {
    //base mainnet
    8453: {
      solverAddress: '0x73f4eA10Ed8e6524aB3Ba60D604A6f33Cb95fc39',
      targets: {
        //base mainnet USDC
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
        },
      },
      network: 'base-mainnet',
      chainID: 8453,
    },
    //op mainnet
    10: {
      solverAddress: '0xd01168742A682146095c3bCe1ad6527837593a85',
      targets: {
        //op mainnet USDC
        '0x0b2c639c533813f4aa9d7837caf62653d097ff85': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
        },
      },
      network: 'opt-mainnet',
      chainID: 10,
    },
  },
}
