import { dependency, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'
import { protocols } from '@mimic-fi/v3-helpers'

const shared = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  name: 'balancer-v2-swap-connector@v1.0.0',
  contract: 'BalancerV2SwapConnector',
  stateless: true,
}

const mainnet: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.mainnet.BALANCER_V2_VAULT],
}

const polygon: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.polygon.BALANCER_V2_VAULT],
}

const arbitrum: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.arbitrum.BALANCER_V2_VAULT],
}

const optimism: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.optimism.BALANCER_V2_VAULT],
}

const gnosis: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.gnosis.BALANCER_V2_VAULT],
}

const avalanche: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.avalanche.BALANCER_V2_VAULT],
}

const base: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.base.BALANCER_V2_VAULT],
}

const zkevm: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.zkevm.BALANCER_V2_VAULT],
}

const fantom: RegistryImplementationDeployment = {
  ...shared,
  args: ['0x20dd72ed959b6147912c2e529f0a0c651c33c9ce'],
}

export default { mainnet, polygon, arbitrum, optimism, gnosis, avalanche, base, zkevm, fantom }
