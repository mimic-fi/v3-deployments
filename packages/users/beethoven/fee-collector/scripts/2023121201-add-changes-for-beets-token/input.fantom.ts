import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { DAY } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

const BEETS = '0xF24Bcf4d1e507740041C9cFd2DddB29585aDCe1e' //Beethoven token
const WITHDRAWER_RECIPIENT = '0xa1e849b1d6c2fd31c63eef7822e9e0632411ada7'

const TIMELOCK_MODE = {
  SECONDS: 0,
  ON_DAY: 1,
  ON_LAST_DAY: 2,
  EVERY_X_MONTH: 3,
}

//Config - Withdrawer Timelock
const WITHDRAWER_TIMELOCK_MODE = TIMELOCK_MODE.ON_LAST_DAY
const WITHDRAWER_TIMELOCK_FREQUENCY = 1 //1 month
const WITHDRAWER_TIMELOCK_ALLOWED_AT = 1701342000 //11:00hs GMT
const WITHDRAWER_TIMELOCK_WINDOW = 2 * DAY //2 days

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
  steps: [
    //Withdrawer BEETS
    {
      from: DEPLOYER,
      name: 'withdrawer-beets',
      version: dependency('core/tasks/primitives/withdrawer/v2.0.0'),
      config: {
        recipient: WITHDRAWER_RECIPIENT,
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023111100-environment-deploy', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [BEETS],
          },
          timeLockConfig: {
            mode: WITHDRAWER_TIMELOCK_MODE,
            frequency: WITHDRAWER_TIMELOCK_FREQUENCY,
            allowedAt: WITHDRAWER_TIMELOCK_ALLOWED_AT,
            window: WITHDRAWER_TIMELOCK_WINDOW,
          },
        },
      },
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', 'smart-vault'),
          revokes: [],
          grants: [
            {
              who: dependency('withdrawer-beets'),
              what: 'withdraw',
              params: [],
            },
            {
              who: dependency('withdrawer-beets'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('withdrawer-beets'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', '1inch-swapper'),
      method: 'setTokensAcceptanceList',
      args: [[BEETS], [true]],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
      method: 'setTokensAcceptanceList',
      args: [[BEETS], [true]],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
