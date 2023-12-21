import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { DAY } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TIMELOCK_MODE = {
  SECONDS: 0,
  ON_DAY: 1,
  ON_LAST_DAY: 2,
  EVERY_X_MONTH: 3,
}

const MODE = TIMELOCK_MODE.SECONDS
const FREQUENCY = 14 * DAY //14 days
const ALLOWED_AT = 1701936000 //Thursday, 7 December 2023 8:00:00 GMT
const WINDOW = 2 * DAY

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'cctp-bridger'),
          grants: [{ who: DEPLOYER.address, what: 'setTimeLock', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'cctp-bridger'),
      method: 'setTimeLock',
      args: [MODE, FREQUENCY, ALLOWED_AT, WINDOW],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'cctp-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setTimeLock' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
