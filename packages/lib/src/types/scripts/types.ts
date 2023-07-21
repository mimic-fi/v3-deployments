import { Account } from '../accounts'
import { Dependency } from '../dependencies'
import { CreateEnvironmentParams, UpdateEnvironmentParams } from '../environment'

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ContractDeployment = {
  contract: string
  name?: string
  args: any[]
  from: Account
}

export type RegistryImplementationDeployment = ContractDeployment & {
  registry: Dependency
  stateless: boolean
  deployerIfFail?: Account
}

export type EnvironmentDeployment = CreateEnvironmentParams & {
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
