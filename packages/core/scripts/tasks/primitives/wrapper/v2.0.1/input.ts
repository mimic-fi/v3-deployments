import { dependency, DEPLOYER, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'

const zkevm: RegistryImplementationDeployment = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  contract: 'Wrapper',
  name: 'wrapper@v2.0.1',
  args: [],
  stateless: false,
  deployerIfFail: DEPLOYER,
  deprecate: dependency('core/tasks/primitives/wrapper/v2.0.0'),
}

export default { zkevm }
