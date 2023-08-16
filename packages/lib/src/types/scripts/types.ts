import { EnvironmentDeployment, EnvironmentUpdate } from '../environment'
import { ContractDeployment, RegistryImplementationDeployment } from '../registry'

export type ScriptInput =
  | ContractDeployment
  | RegistryImplementationDeployment
  | EnvironmentDeployment
  | EnvironmentUpdate
