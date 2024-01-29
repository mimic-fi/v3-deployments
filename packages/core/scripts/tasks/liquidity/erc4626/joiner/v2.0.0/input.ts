import { dependency, DEPLOYER, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'

const polygon: RegistryImplementationDeployment = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  contract: 'ERC4626Joiner',
  name: 'erc4626-joiner@v2.0.0',
  args: [],
  stateless: false,
  deployerIfFail: DEPLOYER,
}

export default { polygon }
