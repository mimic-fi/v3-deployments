import { BigNumberish } from '@mimic-fi/v3-helpers'

import { Dependency } from '../dependencies'
import { OptionalTaskConfig } from './base'

export type BalancerBptExitConfig = {
  taskConfig: OptionalTaskConfig
  balancerVault: string
}

export type BaseCurveConfig = {
  taskConfig: OptionalTaskConfig
  connector: Dependency
  tokenOut: string
  maxSlippage: BigNumberish
  customTokensOut: { token: string; tokenOut: string }[]
  customMaxSlippages: { token: string; maxSlippage: string }[]
}

export type Curve2CrvJoinConfig = {
  baseCurveConfig: BaseCurveConfig
}

export type Curve2CrvExitConfig = {
  baseCurveConfig: BaseCurveConfig
}

export type CurveTaskConfig = Curve2CrvJoinConfig | Curve2CrvExitConfig

export type BaseConvexConfig = {
  taskConfig: OptionalTaskConfig
  connector: Dependency
}

export type ConvexJoinConfig = {
  baseConvexConfig: BaseConvexConfig
}

export type ConvexExitConfig = {
  baseConvexConfig: BaseConvexConfig
}

export type ConvexTaskConfig = ConvexJoinConfig | ConvexExitConfig

export type LiquidityTaskConfig = CurveTaskConfig | ConvexTaskConfig | BalancerBptExitConfig
