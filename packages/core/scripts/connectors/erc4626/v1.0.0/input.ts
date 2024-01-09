import { dependency, PROTOCOL_ADMIN } from '@mimic-fi/v3-deployments-lib'

const polygon = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  name: 'erc4626-connector@v1.0.0',
  contract: 'ERC4626Connector',
  stateless: true,
}

export default { polygon }
