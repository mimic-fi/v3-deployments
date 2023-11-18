import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const WITHDRAWALS_URL = 'https://jsonkeeper.com/b/5TQN'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: '1inch-tw-airdropper-v2',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101900-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101900-environment-deploy', 'withdrawer2'),
          grants: [{ who: DEPLOYER.address, what: 'setSignedWithdrawalsUrl', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101900-environment-deploy', 'withdrawer2'),
      method: 'setSignedWithdrawalsUrl',
      args: [WITHDRAWALS_URL],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101900-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101900-environment-deploy', 'withdrawer2'),
          revokes: [{ who: DEPLOYER.address, what: 'setSignedWithdrawalsUrl' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
