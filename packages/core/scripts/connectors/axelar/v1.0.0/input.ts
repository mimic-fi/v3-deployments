import { dependency, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'
import { protocols } from '@mimic-fi/v3-helpers'

const shared = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  name: 'axelar-connector@v1.0.0',
  contract: 'AxelarConnector',
  stateless: true,
}

const mainnet: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.mainnet.AXELAR_GATEWAY],
}

const polygon: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.polygon.AXELAR_GATEWAY],
}

const arbitrum: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.arbitrum.AXELAR_GATEWAY],
}

const bsc: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.bsc.AXELAR_GATEWAY],
}

const fantom: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.fantom.AXELAR_GATEWAY],
}

const avalanche: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.avalanche.AXELAR_GATEWAY],
}

const base: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.base.AXELAR_GATEWAY],
}

export default { mainnet, polygon, arbitrum, bsc, fantom, avalanche, base }
