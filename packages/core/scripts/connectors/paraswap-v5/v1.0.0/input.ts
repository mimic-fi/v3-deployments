import { dependency, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'
import { protocols } from '@mimic-fi/v3-helpers'

const shared = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  name: 'paraswap-v5-connector@v1.0.0',
  contract: 'ParaswapV5Connector',
  stateless: true,
}

const mainnet: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.mainnet.PARASWAP_V5_AUGUSTUS],
}

const polygon: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.polygon.PARASWAP_V5_AUGUSTUS],
}

const arbitrum: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.arbitrum.PARASWAP_V5_AUGUSTUS],
}

const optimism: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.optimism.PARASWAP_V5_AUGUSTUS],
}

const bsc: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.bsc.PARASWAP_V5_AUGUSTUS],
}

const fantom: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.fantom.PARASWAP_V5_AUGUSTUS],
}

const avalanche: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.avalanche.PARASWAP_V5_AUGUSTUS],
}

const base: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.base.PARASWAP_V5_AUGUSTUS],
}

const zkevm: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.zkevm.PARASWAP_V5_AUGUSTUS],
}

export default { mainnet, polygon, arbitrum, optimism, bsc, fantom, avalanche, base, zkevm }
