import {
  dependency,
  MIMIC_V2_FEE_COLLECTOR,
  PROTOCOL_ADMIN,
  PROTOCOL_ADMIN_AURORA,
  RegistryImplementationDeployment,
} from '@mimic-fi/v3-deployments-lib'

const deployment: RegistryImplementationDeployment = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  name: 'fee-controller@v1.0.0',
  contract: 'FeeController',
  args: [MIMIC_V2_FEE_COLLECTOR.sv, PROTOCOL_ADMIN.safe],
  stateless: false,
}

const aurora: RegistryImplementationDeployment = {
  from: PROTOCOL_ADMIN_AURORA,
  registry: dependency('core/registry/v1.0.0'),
  name: 'fee-controller@v1.0.0',
  contract: 'FeeController',
  args: [PROTOCOL_ADMIN_AURORA.safe, PROTOCOL_ADMIN_AURORA.safe],
  stateless: false,
}

export default { ...deployment, aurora }
