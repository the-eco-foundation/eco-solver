export default {
  logger: {
    usePino: false,
  },
  sourceIntents: [
    {
      network: 'opt-sepolia',
      sourceAddress: '0x6B79cD3fE2Eccd3a69c52e621a81d26E75983787',
    },
  ],
  solvers: {
    84532: {
      solverAddress: '0x5d0cab22a8E2F01CE4482F2CbFE304627d8F1816',
      targets: {
        //base sepolia USDC
        '0xAb1D243b07e99C91dE9E4B80DFc2B07a8332A2f7': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
        },
      },
      network: 'base-sepolia',
    },
    11155420: {
      solverAddress: '0x5d0cab22a8E2F01CE4482F2CbFE304627d8F1816', //todo update to real address
      targets: {
        //op sepolia USDC
        '0x5fd84259d66Cd46123540766Be93DFE6D43130D7': {
          contractType: 'erc20',
          selectors: ['transfer(address,uint256)'],
        },
      },
      network: 'op-sepolia',
    },
  },
}
