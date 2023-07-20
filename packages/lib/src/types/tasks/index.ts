import { OptionalTaskConfig } from './base'
import { BridgeTaskConfig } from './bridge'
import { LiquidityTaskConfig } from './liquidity'
import { PrimitiveTaskConfig } from './primitives'
import { SwapTaskConfig } from './swap'

export * from './base'
export * from './bridge'
export * from './liquidity'
export * from './primitives'
export * from './swap'

export type StandardTaskConfig =
  | OptionalTaskConfig
  | PrimitiveTaskConfig
  | BridgeTaskConfig
  | SwapTaskConfig
  | LiquidityTaskConfig
