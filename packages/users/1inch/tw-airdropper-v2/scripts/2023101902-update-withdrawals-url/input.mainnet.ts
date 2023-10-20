import { dependency, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const WITHDRAWALS_URL = 'https://www.jsonkeeper.com/b/V7D4'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: '1inch-tw-airdropper-v2',
  steps: [
    {
      from: USERS_ADMIN,
      target: dependency('withdrawer'),
      method: 'setSignedWithdrawalsUrl',
      args: [WITHDRAWALS_URL],
    },
  ],
}

export default update
