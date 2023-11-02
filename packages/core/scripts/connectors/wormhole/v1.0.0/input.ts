import { dependency, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'
import { protocols } from '@mimic-fi/v3-helpers'

const shared = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  name: 'wormhole-connector@v1.0.0',
  contract: 'WormholeConnector',
  stateless: true,
}

const mainnet: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.mainnet.WORMHOLE_CIRCLE_RELAYER],
}

const arbitrum: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.arbitrum.WORMHOLE_CIRCLE_RELAYER],
}

const avalanche: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.avalanche.WORMHOLE_CIRCLE_RELAYER],
}

const optimism: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.optimism.WORMHOLE_CIRCLE_RELAYER],
}

export default { mainnet, arbitrum, avalanche, optimism }
