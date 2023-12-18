import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { DAY } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TIMELOCK_MODE = {
  SECONDS: 0,
  ON_DAY: 1,
  ON_LAST_DAY: 2,
}

//Config - Bridger Timelock
const BRIDGER_TIMELOCK_MODE = TIMELOCK_MODE.SECONDS //SECONDS
const BRIDGER_TIMELOCK_FREQUENCY = 2419200 //28 days
const BRIDGER_TIMELOCK_ALLOWED_AT = 1701064800 //Monday, 27 November 2023 6:00:00
const BRIDGER_TIMELOCK_WINDOW = 15 * DAY //2 days

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'wormhole-bridger'),
          grants: [{ who: DEPLOYER.address, what: 'setTimeLock', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111700-environment-deploy', 'wormhole-bridger'),
      method: 'setTimeLock',
      args: [BRIDGER_TIMELOCK_MODE, BRIDGER_TIMELOCK_FREQUENCY, BRIDGER_TIMELOCK_ALLOWED_AT, BRIDGER_TIMELOCK_WINDOW],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'wormhole-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setTimeLock' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
