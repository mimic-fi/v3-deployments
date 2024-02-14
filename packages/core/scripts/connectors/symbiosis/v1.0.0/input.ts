import { dependency, PROTOCOL_ADMIN, RegistryImplementationDeployment } from '@mimic-fi/v3-deployments-lib'

/* eslint-disable no-secrets/no-secrets */

const SYMBIOSIS_META_ROUTER = '0xDF41Ce9d15e9b6773ef20cA682AFE56af6Bb3F94'

const zkevm: RegistryImplementationDeployment = {
  from: PROTOCOL_ADMIN,
  registry: dependency('core/registry/v1.0.0'),
  name: 'symbiosis-connector@v1.0.0',
  contract: 'SymbiosisConnector',
  args: [SYMBIOSIS_META_ROUTER],
  stateless: true,
}

export default { zkevm }
