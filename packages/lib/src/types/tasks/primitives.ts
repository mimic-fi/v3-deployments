import { CounterFactualDependency, Dependency } from '../dependencies'
import { OptionalTaskConfig } from './base'

export type DepositConfig = {
  taskConfig: OptionalTaskConfig
  tokensSource: CounterFactualDependency
}

export type CollectConfig = {
  taskConfig: OptionalTaskConfig
  tokensSource: string | Dependency
}

export type WithdrawConfig = {
  taskConfig: OptionalTaskConfig
  recipient: string
}

export type WrapConfig = {
  taskConfig: OptionalTaskConfig
}

export type PrimitiveTaskConfig = DepositConfig | CollectConfig | WithdrawConfig | WrapConfig
