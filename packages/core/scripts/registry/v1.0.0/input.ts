import { ContractDeployment, ORIGIN, PROTOCOL_ADMIN, PROTOCOL_ADMIN_AURORA } from '@mimic-fi/v3-deployments-lib'

const deployment: ContractDeployment = {
  from: ORIGIN,
  contract: 'Registry',
  args: [PROTOCOL_ADMIN.safe],
}

const aurora: ContractDeployment = {
  from: ORIGIN,
  contract: 'Registry',
  args: [PROTOCOL_ADMIN_AURORA.safe],
}

export default { ...deployment, aurora }
