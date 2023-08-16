import {
  dependency,
  MIMIC_V2_BOT,
  MIMIC_V2_FEE_COLLECTOR,
  PROTOCOL_ADMIN,
  RegistryImplementationDeployment,
} from '@mimic-fi/v3-deployments-lib'

const deployment: RegistryImplementationDeployment = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  contract: 'Relayer',
  name: 'relayer@v1.1.0',
  args: [MIMIC_V2_BOT.address, MIMIC_V2_FEE_COLLECTOR.sv, PROTOCOL_ADMIN.safe],
  stateless: false,
}

export default deployment
