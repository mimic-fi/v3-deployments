import { Libraries } from '@mimic-fi/v3-helpers'

import { Account } from './accounts'

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
]

export type Network = (typeof NETWORKS)[number]

export type NAry<T> = T | Array<T>

export type TxParams = {
  from: Account
  force: boolean
  libs?: Libraries
}
