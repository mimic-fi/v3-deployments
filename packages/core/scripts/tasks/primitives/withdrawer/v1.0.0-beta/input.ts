import { dependency, DEPLOYER, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'

const deployment: RegistryImplementationDeployment = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0-beta'),
  contract: 'Withdrawer',
  args: [],
  stateless: false,
  deployerIfFail: DEPLOYER,
}

export default deployment