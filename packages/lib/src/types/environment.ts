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

export type CreateEnvironmentParams = {
  namespace: string
  authorizer: AuthorizerParams
  priceOracle: PriceOracleParams
  smartVault: SmartVaultParams
  tasks: TaskParams[]
  permissions: {
    from: Account
    changes: PermissionChange[]
  }
}

export type UpdateEnvironmentParams = {
  namespace: string
  authorizer: Dependency
  tasks: TaskParams[]
  permissions: {
    from: Account
    changes: PermissionChange[]
  }
}

export type Environment = {
  namespace: string
  deployer: Contract
  authorizer?: Contract
  priceOracle?: Contract
  smartVault?: Contract
  tasks?: Contract[]
}
