import { BigNumberish } from '@mimic-fi/v3-helpers'

import { Account } from './accounts'
import { Dependency } from './dependencies'
import { PermissionChange } from './permissions'
import { StandardTaskConfig } from './tasks'

/* eslint-disable @typescript-eslint/no-explicit-any */

export type AuthorizerParams = {
  from: Account
  name: string
  version: Dependency
  owners: string[]
}

export type PriceOracleParams = {
  from: Account
  name: string
  version: Dependency
  authorizer: Dependency
  signer: string
  pivot: string
  feeds: { base: string; quote: string; feed: string }[]
}

export type SmartVaultParams = {
  from: Account
  name: string
  version: Dependency
  authorizer: Dependency
  priceOracle: Dependency
}

export type TaskParams = {
  from: Account
  name: string
  version: string | Dependency
  config: StandardTaskConfig
  args?: any[]
  initialize?: string
}

export type PermissionsUpdate = {
  from: Account
  authorizer: Dependency
  changes: PermissionChange[]
}

export type SmartVaultFeeSettings = {
  from: Account
  smartVault: Dependency
  feeController: Dependency
  maxFeePct: BigNumberish
  feePct?: BigNumberish
  feeCollector?: string | Dependency
}

export type SmartVaultRelayerSettings = {
  from: Account
  smartVault: Dependency
  relayer: Dependency
  quota?: BigNumberish
  collector?: string | Dependency
}

export type EnvironmentDeployment = {
  deployer: Dependency
  namespace: string
  authorizer: AuthorizerParams
  priceOracle: PriceOracleParams
  smartVaults: SmartVaultParams[]
  tasks: TaskParams[]
  permissions: PermissionsUpdate
  feeSettings: SmartVaultFeeSettings
  relayerSettings?: SmartVaultRelayerSettings
}

export type EnvironmentUpdate = {
  deployer: Dependency
  namespace: string
  steps: EnvironmentUpdateStep[]
}

export type EnvironmentSettingUpdate = {
  from: Account
  target: Dependency
  method: string
  args: any[]
}

export type EnvironmentUpdateStep =
  | TaskParams
  | SmartVaultParams
  | PermissionsUpdate
  | SmartVaultFeeSettings
  | SmartVaultRelayerSettings
  | EnvironmentSettingUpdate
