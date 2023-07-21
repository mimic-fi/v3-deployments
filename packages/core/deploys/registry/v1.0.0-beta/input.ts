import { ContractDeployment, ORIGIN, PROTOCOL_ADMIN } from '@mimic-fi/v3-deployments-lib'

const deployment: ContractDeployment = {
  from: ORIGIN,
  contract: 'Registry',
  args: [PROTOCOL_ADMIN.safe],
}

export default deployment
