import { dependency, DEPLOYER, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'

const deployment: RegistryImplementationDeployment = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  contract: 'ParaswapV5Swapper',
  name: 'paraswap-v5-swapper@v2.0.0',
  args: [],
  stateless: false,
  deployerIfFail: DEPLOYER,
}

export default {
  mainnet: deployment,
  polygon: deployment,
  arbitrum: deployment,
  optimism: deployment,
  bsc: deployment,
  fantom: deployment,
  avalanche: deployment,
  base: deployment,
  zkevm: deployment,
}
