import {
  dependency,
  PROTOCOL_ADMIN,
  PROTOCOL_ADMIN_AURORA,
  RegistryImplementationDeployment,
} from '@mimic-fi/v3-deployments-lib'

const deployment: RegistryImplementationDeployment = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  name: 'authorizer@v1.1.0',
  contract: 'Authorizer',
  args: [],
  stateless: false,
}

const aurora: RegistryImplementationDeployment = {
  ...deployment,
  from: PROTOCOL_ADMIN_AURORA,
}

export default { ...deployment, aurora }
