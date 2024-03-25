import { dependency, EnvironmentUpdate, PROTOCOL_ADMIN, MIMIC_V2_BOT } from '@mimic-fi/v3-deployments-lib'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'mimic-fee-collector',
  steps: [
    {
      from: PROTOCOL_ADMIN,
      target: dependency('core/relayer/v1.1.0'),
      method: 'setDefaultCollector',
      args: [MIMIC_V2_BOT.address],
    },
    {
      from: PROTOCOL_ADMIN,
      target: dependency('core/relayer/v2.0.0'),
      method: 'setDefaultCollector',
      args: [MIMIC_V2_BOT.address],
    },
    {
      from: PROTOCOL_ADMIN,
      target: dependency('core/fee-controller/v1.0.0'),
      method: 'setDefaultFeeCollector',
      args: [dependency('2024032000-environment-deploy', 'fee-depositor')],
    },
  ],
}

export default update
