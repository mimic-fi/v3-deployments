import { BigNumberish } from '@mimic-fi/v3-helpers'

import { Dependency } from '../dependencies'
import { OptionalTaskConfig } from './base'

export type BaseBridgeConfig = {
  connector: Dependency
  recipient: string
  destinationChain: BigNumberish
  maxSlippage: BigNumberish
  maxFee: { token: string; amount: BigNumberish }
  customDestinationChains: { token: string; destinationChain: BigNumberish }[]
  customMaxSlippages: { token: string; maxSlippage: BigNumberish }[]
  customMaxFees: { token: string; maxFeePct: BigNumberish }[]
  taskConfig: OptionalTaskConfig
}

export type AxelarBridgeConfig = {
  baseBridgeConfig: BaseBridgeConfig
}

export type ConnextBridgeConfig = {
  baseBridgeConfig: BaseBridgeConfig
}

export type HopBridgeConfig = {
  baseBridgeConfig: BaseBridgeConfig
  relayer: string
  maxDeadline: BigNumberish
  tokenHopEntrypoints: { token: string; entrypoint: string }[]
}

export type WormholeBridgeConfig = {
  baseBridgeConfig: BaseBridgeConfig
}

export type BridgeTaskConfig = AxelarBridgeConfig | ConnextBridgeConfig | HopBridgeConfig | WormholeBridgeConfig
