import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const WITHDRAWALS_URL = 'https://www.jsonkeeper.com/b/Q1I4'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: '1inch-tw-airdropper-v2',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101900-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101900-environment-deploy', 'withdrawer'),
          grants: [{ who: DEPLOYER.address, what: 'setSignedWithdrawalsUrl', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101900-environment-deploy', 'withdrawer'),
      method: 'setSignedWithdrawalsUrl',
      args: [WITHDRAWALS_URL],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101900-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101900-environment-deploy', 'withdrawer'),
          revokes: [{ who: DEPLOYER.address, what: 'setSignedWithdrawalsUrl' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
