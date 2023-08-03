import { BigNumberish } from '@mimic-fi/v3-helpers'

import { Dependency } from '../dependencies'
import { OptionalTaskConfig } from './base'

export type BaseBridgeConfig = {
  connector: Dependency
  recipient: string
  destinationChain: BigNumberish
  maxSlippage: BigNumberish
  customDestinationChains: { token: string; destinationChain: BigNumberish }[]
  customMaxSlippages: { token: string; maxSlippage: BigNumberish }[]
  taskConfig: OptionalTaskConfig
}

export type AxelarBridgeConfig = {
  baseBridgeConfig: BaseBridgeConfig
}

export type ConnextBridgeConfig = {
  baseBridgeConfig: BaseBridgeConfig
  maxFeePct: BigNumberish
  customMaxFeePcts: { token: string; maxFeePct: BigNumberish }[]
}

export type HopBridgeConfig = {
  baseBridgeConfig: BaseBridgeConfig
  relayer: string
  maxFeePct: BigNumberish
  maxDeadline: BigNumberish
  customMaxFeePcts: { token: string; maxFeePct: BigNumberish }[]
  tokenHopEntrypoints: { token: string; entrypoint: string }[]
}

export type WormholeBridgeConfig = {
  baseBridgeConfig: BaseBridgeConfig
}

export type BridgeTaskConfig = AxelarBridgeConfig | ConnextBridgeConfig | HopBridgeConfig | WormholeBridgeConfig
