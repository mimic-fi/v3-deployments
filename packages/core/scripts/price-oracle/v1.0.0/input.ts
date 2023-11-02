import {
  dependency,
  PROTOCOL_ADMIN,
  PROTOCOL_ADMIN_AURORA,
  RegistryImplementationDeployment,
} from '@mimic-fi/v3-deployments-lib'

const deployment: RegistryImplementationDeployment = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  name: 'price-oracle@v1.0.0',
  contract: 'PriceOracle',
  args: [],
  stateless: false,
}

const aurora: RegistryImplementationDeployment = {
  ...deployment,
  from: PROTOCOL_ADMIN_AURORA,
}

export default { ...deployment, aurora }
