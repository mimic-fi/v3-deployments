import { dependency, DEPLOYER, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'

const deployment: RegistryImplementationDeployment = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  contract: 'BalancerV2BoostedSwapper',
  name: 'balancer-v2-boosted-swapper@v2.0.0',
  args: [],
  stateless: false,
  deployerIfFail: DEPLOYER,
}

export default { mainnet: deployment, base: deployment, avalanche: deployment }
