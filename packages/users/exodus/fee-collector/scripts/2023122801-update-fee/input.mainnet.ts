import { dependency, EnvironmentUpdate, PROTOCOL_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp } from '@mimic-fi/v3-helpers'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'exodus-fee-collector',
  steps: [
    {
      from: PROTOCOL_ADMIN,
      smartVault: dependency('2023121800-environment-deploy', 'smart-vault'),
      feeController: dependency('core/fee-controller/v1.0.0'),
      maxFeePct: fp(0.02), // 2%
      feePct: 0,
    },
  ],
}

export default update
