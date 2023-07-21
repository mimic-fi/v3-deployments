import {
  ContractDeployment,
  EnvironmentDeployment,
  EnvironmentUpdate,
  RegistryImplementationDeployment,
  ScriptInput,
} from './types'

export function isContractDeployment(input: ScriptInput): input is ContractDeployment {
  const contractDeployment = input as ContractDeployment
  return !!contractDeployment.contract
}

export function isRegistryImplementationDeployment(input: ScriptInput): input is RegistryImplementationDeployment {
  const implementationDeployment = input as RegistryImplementationDeployment
  return !!implementationDeployment.registry
}

export function isEnvironmentDeployment(input: ScriptInput): input is EnvironmentDeployment {
  const environmentDeployment = input as EnvironmentDeployment
  return !!environmentDeployment.smartVault
}

export function isEnvironmentUpdate(input: ScriptInput): input is EnvironmentUpdate {
  const environmentUpdate = input as EnvironmentUpdate
  return !!environmentUpdate.authorizer && !isEnvironmentDeployment(input)
}
