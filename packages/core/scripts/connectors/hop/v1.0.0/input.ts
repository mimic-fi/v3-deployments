import { dependency, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'
import { tokens } from '@mimic-fi/v3-helpers'

const shared = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  name: 'hop-connector@v1.0.0',
  contract: 'HopConnector',
  stateless: true,
}

const mainnet: RegistryImplementationDeployment = {
  ...shared,
  args: [tokens.mainnet.WETH],
}

const polygon: RegistryImplementationDeployment = {
  ...shared,
  args: [tokens.polygon.WMATIC],
}

const arbitrum: RegistryImplementationDeployment = {
  ...shared,
  args: [tokens.arbitrum.WETH],
}

const optimism: RegistryImplementationDeployment = {
  ...shared,
  args: [tokens.optimism.WETH],
}

const base: RegistryImplementationDeployment = {
  ...shared,
  args: [tokens.base.WETH],
}

export default { mainnet, polygon, arbitrum, optimism, base }
