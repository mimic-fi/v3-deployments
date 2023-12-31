import {
  dependency,
  PROTOCOL_ADMIN,
  PROTOCOL_ADMIN_AURORA,
  RegistryImplementationDeployment,
} from '@mimic-fi/v3-deployments-lib'
import { tokens } from '@mimic-fi/v3-helpers'

const shared = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  name: 'smart-vault@v1.0.0',
  contract: 'SmartVault',
  stateless: false,
}

const mainnet: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0'), dependency('core/fee-controller/v1.0.0'), tokens.mainnet.WETH],
}

const polygon: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0'), dependency('core/fee-controller/v1.0.0'), tokens.polygon.WMATIC],
}

const arbitrum: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0'), dependency('core/fee-controller/v1.0.0'), tokens.arbitrum.WETH],
}

const optimism: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0'), dependency('core/fee-controller/v1.0.0'), tokens.optimism.WETH],
}

const gnosis: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0'), dependency('core/fee-controller/v1.0.0'), tokens.gnosis.WXDAI],
}

const bsc: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0'), dependency('core/fee-controller/v1.0.0'), tokens.bsc.WBNB],
}

const fantom: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0'), dependency('core/fee-controller/v1.0.0'), tokens.fantom.WFTM],
}

const avalanche: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0'), dependency('core/fee-controller/v1.0.0'), tokens.avalanche.WAVAX],
}

const base: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0'), dependency('core/fee-controller/v1.0.0'), tokens.base.WETH],
}

const zkevm: RegistryImplementationDeployment = {
  ...shared,
  args: [dependency('core/registry/v1.0.0'), dependency('core/fee-controller/v1.0.0'), tokens.zkevm.WETH],
}

const aurora: RegistryImplementationDeployment = {
  ...shared,
  from: PROTOCOL_ADMIN_AURORA,
  args: [dependency('core/registry/v1.0.0'), dependency('core/fee-controller/v1.0.0'), tokens.aurora.WETH],
}

export default { mainnet, polygon, arbitrum, optimism, gnosis, bsc, fantom, avalanche, base, zkevm, aurora }
