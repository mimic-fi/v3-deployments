import { dependency, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'
import { protocols } from '@mimic-fi/v3-helpers'

const shared = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0-beta'),
  contract: 'OneInchV5Connector',
  stateless: true,
}

const mainnet: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.mainnet.ONE_INCH_V5_ROUTER],
}

const polygon: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.polygon.ONE_INCH_V5_ROUTER],
}

const arbitrum: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.arbitrum.ONE_INCH_V5_ROUTER],
}

const optimism: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.optimism.ONE_INCH_V5_ROUTER],
}

const gnosis: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.gnosis.ONE_INCH_V5_ROUTER],
}

const bsc: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.bsc.ONE_INCH_V5_ROUTER],
}

const fantom: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.fantom.ONE_INCH_V5_ROUTER],
}

const avalanche: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.avalanche.ONE_INCH_V5_ROUTER],
}

export default { mainnet, polygon, arbitrum, optimism, gnosis, bsc, fantom, avalanche }
