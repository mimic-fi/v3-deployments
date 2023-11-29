import { dependency, DEPLOYER, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'

const deployment: RegistryImplementationDeployment = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  contract: 'ConnextBridger',
  name: 'connext-bridger@v2.0.0',
  args: [],
  stateless: false,
  deployerIfFail: DEPLOYER,
}

export default {
  mainnet: deployment,
  polygon: deployment,
  arbitrum: deployment,
  optimism: deployment,
  gnosis: deployment,
  bsc: deployment,
}
