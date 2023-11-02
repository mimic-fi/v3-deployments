import { dependency, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'
import { protocols } from '@mimic-fi/v3-helpers'

const shared = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  name: 'connext-connector@v1.0.0',
  contract: 'ConnextConnector',
  stateless: true,
}

const mainnet: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.mainnet.CONNEXT_ENTRYPOINT],
}

const polygon: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.polygon.CONNEXT_ENTRYPOINT],
}

const arbitrum: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.arbitrum.CONNEXT_ENTRYPOINT],
}

const optimism: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.optimism.CONNEXT_ENTRYPOINT],
}

const gnosis: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.gnosis.CONNEXT_ENTRYPOINT],
}

const bsc: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.bsc.CONNEXT_ENTRYPOINT],
}

export default { mainnet, polygon, arbitrum, optimism, gnosis, bsc }
