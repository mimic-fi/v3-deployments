import { BigNumberish } from '@mimic-fi/v3-helpers'

import { Dependency } from '../dependencies'
import { OptionalTaskConfig } from './base'

export type BaseSwapConfig = {
  taskConfig: OptionalTaskConfig
  connector: Dependency
  tokenOut: string
  maxSlippage: BigNumberish
  customTokensOut: { token: string; tokenOut: string }[]
  customMaxSlippages: { token: string; maxSlippage: string }[]
}

export type HopL2SwapConfig = {
  baseSwapConfig: BaseSwapConfig
  tokenAmms: { token: string; amm: string }[]
}

export type OneInchV55SwapConfig = {
  baseSwapConfig: BaseSwapConfig
}

export type ParaswapV5SwapConfig = {
  baseSwapConfig: BaseSwapConfig
  quoteSigner: string
}

export type SwapTaskConfig = HopL2SwapConfig | OneInchV55SwapConfig | ParaswapV5SwapConfig
