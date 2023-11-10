import { dependency, EnvironmentUpdate, PROTOCOL_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp } from '@mimic-fi/v3-helpers'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'the-graph',
  steps: [
    {
      from: PROTOCOL_ADMIN,
      target: dependency('core/fee-controller/v1.0.0'),
      method: 'setFeePercentage',
      args: [dependency('2023101700-environment-deploy', 'smart-vault'), fp(0.02)],
    },
  ],
}

export default update
