import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: '1inch-tw-airdropper-v2',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101900-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101900-environment-deploy', 'depositor'),
          grants: [{ who: DEPLOYER.address, what: 'setGasLimits', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023101900-environment-deploy', 'withdrawer'),
          grants: [{ who: DEPLOYER.address, what: 'setGasLimits', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101900-environment-deploy', 'depositor'),
      method: 'setGasLimits',
      args: [30e9, 0, 0, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101900-environment-deploy', 'withdrawer'),
      method: 'setGasLimits',
      args: [30e9, 0, 0, 0],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101900-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101900-environment-deploy', 'depositor'),
          revokes: [{ who: DEPLOYER.address, what: 'setGasLimits' }],
          grants: [],
        },
        {
          where: dependency('2023101900-environment-deploy', 'withdrawer'),
          revokes: [{ who: DEPLOYER.address, what: 'setGasLimits' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
