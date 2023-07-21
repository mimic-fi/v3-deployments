import { dependency, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'
import { tokens } from '@mimic-fi/v3-helpers'

const shared = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0-beta'),
  contract: 'SmartVault',
  stateless: false,
}

const mainnet: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0-beta'), dependency('core/fee-controller/v1.0.0-beta'), tokens.mainnet.WETH],
}

const polygon: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0-beta'), dependency('core/fee-controller/v1.0.0-beta'), tokens.polygon.WMATIC],
}

const arbitrum: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0-beta'), dependency('core/fee-controller/v1.0.0-beta'), tokens.arbitrum.WETH],
}

const optimism: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0-beta'), dependency('core/fee-controller/v1.0.0-beta'), tokens.optimism.WETH],
}

const gnosis: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0-beta'), dependency('core/fee-controller/v1.0.0-beta'), tokens.gnosis.WXDAI],
}

const bsc: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0-beta'), dependency('core/fee-controller/v1.0.0-beta'), tokens.bsc.WBNB],
}

const fantom: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0-beta'), dependency('core/fee-controller/v1.0.0-beta'), tokens.fantom.WFTM],
}

const avalanche: RegistryImplementationDeployment = {
  ...shared,
  args: [
    dependency('core/registry/v1.0.0-beta'),
    dependency('core/fee-controller/v1.0.0-beta'),
    tokens.avalanche.WAVAX,
  ],
}

export default { mainnet, polygon, arbitrum, optimism, gnosis, bsc, fantom, avalanche }
