import { dependency, EnvironmentUpdate, PROTOCOL_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp } from '@mimic-fi/v3-helpers'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: PROTOCOL_ADMIN,
      target: dependency('core/relayer/v1.1.0'),
      method: 'setSmartVaultMaxQuota',
      args: [dependency('2023101700-environment-deploy', 'smart-vault'), fp(3)],
    },
  ],
}

export default update
