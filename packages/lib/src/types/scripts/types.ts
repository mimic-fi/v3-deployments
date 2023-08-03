import { Account } from '../accounts'
import { Dependency } from '../dependencies'
import { DeployEnvironmentParams, UpdateEnvironmentParams } from '../environment'

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ContractDeployment = {
  contract: string
  instanceName?: string
  args: any[]
  from: Account
}

export type RegistryImplementationDeployment = ContractDeployment & {
  registry: Dependency
  name: string
  stateless: boolean
  deployerIfFail?: Account
}

export type EnvironmentDeployment = DeployEnvironmentParams & {
  deployer: Dependency
  from: Account
}

export type EnvironmentUpdate = UpdateEnvironmentParams & {
  deployer: Dependency
  from: Account
}

export type ScriptInput =
  | ContractDeployment
  | RegistryImplementationDeployment
  | EnvironmentDeployment
  | EnvironmentUpdate
