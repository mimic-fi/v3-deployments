import {
  BridgeTaskConfig,
  CollectConfig,
  ConvexTaskConfig,
  CurveTaskConfig,
  DepositConfig,
  PrimitiveTaskConfig,
  StandardTaskConfig,
  SwapTaskConfig,
  TaskConfig,
} from './index'

export function isTaskConfig(config: StandardTaskConfig): config is TaskConfig {
  return !!(config as TaskConfig).baseConfig
}

export function isBridgeTaskConfig(config: StandardTaskConfig): config is BridgeTaskConfig {
  return !!(config as BridgeTaskConfig).baseBridgeConfig
}

export function isSwapTaskConfig(config: StandardTaskConfig): config is SwapTaskConfig {
  return !!(config as SwapTaskConfig).baseSwapConfig
}

export function isPrimitiveTaskConfig(config: StandardTaskConfig): config is PrimitiveTaskConfig {
  return !!(config as PrimitiveTaskConfig).taskConfig
}

export function isCollectTaskConfig(config: PrimitiveTaskConfig): config is CollectConfig {
  return !!(config as CollectConfig).tokensSource
}

export function isDepositTaskConfig(config: CollectConfig): config is DepositConfig {
  const tokensSource = (config as DepositConfig).tokensSource
  return typeof tokensSource == 'object' && !!tokensSource.counterfactual
}

export function isCurveTaskConfig(config: StandardTaskConfig): config is CurveTaskConfig {
  return !!(config as CurveTaskConfig).baseCurveConfig
}

export function isConvexTaskConfig(config: StandardTaskConfig): config is ConvexTaskConfig {
  return !!(config as ConvexTaskConfig).baseConvexConfig
}
