import { dependency, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'
import { protocols } from '@mimic-fi/v3-helpers'

const shared = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  name: 'balancer-v2-pool-connector@v1.0.0',
  contract: 'BalancerV2PoolConnector',
  stateless: true,
}

const mainnet: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.mainnet.BALANCER_V2_VAULT],
}

const avalanche: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.avalanche.BALANCER_V2_VAULT],
}

const base: RegistryImplementationDeployment = {
  ...shared,
  args: [protocols.base.BALANCER_V2_VAULT],
}

export default { mainnet, avalanche, base }
