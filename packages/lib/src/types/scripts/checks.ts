import {
  EnvironmentDeployment,
  EnvironmentSettingUpdate,
  EnvironmentUpdate,
  EnvironmentUpdateStep,
  PermissionsUpdate,
  SmartVaultFeeSettings,
  SmartVaultRelayerSettings,
  TaskParams,
} from '../environment'
import { ContractDeployment, RegistryImplementationDeployment } from '../registry'
import { ScriptInput } from './types'

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
  return !!environmentUpdate.steps
}

export function isEnvironmentSettingUpdate(input: EnvironmentUpdateStep): input is EnvironmentSettingUpdate {
  const environmentSettingUpdate = input as EnvironmentSettingUpdate
  return !!environmentSettingUpdate.target
}

export function isPermissionsUpdate(input: EnvironmentUpdateStep): input is PermissionsUpdate {
  const permissionsUpdate = input as PermissionsUpdate
  return !!permissionsUpdate.changes
}

export function isTaskParams(input: EnvironmentUpdateStep): input is TaskParams {
  const taskParams = input as TaskParams
  return !!taskParams.config
}

export function isFeeSetting(input: EnvironmentUpdateStep): input is SmartVaultFeeSettings {
  const feeSettings = input as SmartVaultFeeSettings
  return !!feeSettings.feeController
}

export function isRelayerSetting(input: EnvironmentUpdateStep): input is SmartVaultRelayerSettings {
  const relayerSettings = input as SmartVaultRelayerSettings
  return !!relayerSettings.relayer
}
