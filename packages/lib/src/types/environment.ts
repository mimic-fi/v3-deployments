import { BigNumberish } from '@mimic-fi/v3-helpers'
import { Contract } from 'ethers'

import { Account } from './accounts'
import { Dependency } from './dependencies'
import { StandardTaskConfig } from './tasks'

/* eslint-disable @typescript-eslint/no-explicit-any */

export type AuthorizerParams = {
  name: string
  version: Dependency
  owners: string[]
}

export type PriceOracleParams = {
  name: string
  version: Dependency
  signer: string
  pivot: string
  feeds: { base: string; quote: string; feed: string }[]
}

export type SmartVaultParams = {
  name: string
  version: Dependency
}

export type TaskParams = {
  name: string
  version: string | Dependency
  config: StandardTaskConfig
  args?: any[]
  initialize?: string
}

export type RevokePermission = {
  who: string | Dependency
  what: string
}

export type GrantPermission = {
  who: string | Dependency
  what: string
  how: { op: number; value: string | BigNumberish | Dependency }[]
}

export type PermissionChange = {
  where: Dependency
  grants: GrantPermission[]
  revokes: RevokePermission[]
}

export type PermissionChanges = {
  from: Account
  changes: PermissionChange[]
}

export type SmartVaultFeeSettings = {
  from: Account
  feeController: Dependency
  maxFeePct: BigNumberish
  feePct?: BigNumberish
  feeCollector?: string | Dependency
}

export type SmartVaultRelayerSettings = {
  from: Account
  relayer: Dependency
  quota?: BigNumberish
  collector?: string | Dependency
}

export type SmartVaultAdminSettings = {
  fee: SmartVaultFeeSettings
  relayer?: SmartVaultRelayerSettings
}

export type DeployEnvironmentParams = {
  namespace: string
  authorizer: AuthorizerParams
  priceOracle: PriceOracleParams
  smartVault: SmartVaultParams
  tasks: TaskParams[]
  permissions: PermissionChanges
  settings: SmartVaultAdminSettings
}

export type UpdateEnvironmentParams = {
  namespace: string
  authorizer: Dependency
  tasks: TaskParams[]
  permissions: PermissionChanges
}

export type Environment = {
  namespace: string
  deployer: Contract
  authorizer?: Contract
  priceOracle?: Contract
  smartVault?: Contract
  tasks?: Contract[]
}
