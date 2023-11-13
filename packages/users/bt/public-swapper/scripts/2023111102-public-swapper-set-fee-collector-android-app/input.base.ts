import { dependency, EnvironmentUpdate, PROTOCOL_ADMIN } from '@mimic-fi/v3-deployments-lib'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: '1inch-v5-public-swapper-android-app',
  steps: [
    {
      from: PROTOCOL_ADMIN,
      target: dependency('core/fee-controller/v1.0.0'),
      method: 'setFeeCollector',
      args: [
        dependency('2023111101-public-swapper-environment-android-app-deploy', 'smart-vault'), //Smart vault
        dependency('2023111100-public-fee-collector-environment-deploy', 'smart-vault'), //Collector
      ],
    },
  ],
}

export default update
