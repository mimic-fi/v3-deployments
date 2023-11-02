export const NETWORKS = [
  'localhost',
  'hardhat',
  'goerli',
  'mumbai',
  'mainnet',
  'polygon',
  'optimism',
  'arbitrum',
  'gnosis',
  'avalanche',
  'bsc',
  'fantom',
  'base',
  'zkevm',
  'aurora',
]

export type Network = (typeof NETWORKS)[number]
