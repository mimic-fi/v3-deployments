import {
  dependency,
  DEPLOYER,
  PROTOCOL_ADMIN,
  PROTOCOL_ADMIN_AURORA,
  RegistryImplementationDeployment,
} from '@mimic-fi/v3-deployments-lib'

const deployment: RegistryImplementationDeployment = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  contract: 'WormholeBridger',
  name: 'wormhole-bridger@v2.0.0',
  args: [],
  stateless: false,
  deployerIfFail: DEPLOYER,
}

const aurora: RegistryImplementationDeployment = {
  ...deployment,
  from: PROTOCOL_ADMIN_AURORA,
}

export default { ...deployment, aurora }
