import { Account } from './accounts'
import { Dependency } from './dependencies'

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
  deprecate?: Dependency
}

export type RegistryInstanceParams = {
  deployer: Dependency
  namespace: string
  name: string
  from: Account
  version: Dependency
  initializeParams: any
}
