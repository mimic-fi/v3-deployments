import { OP } from '@mimic-fi/v3-authorizer'
import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TIMELOCK_MODE = {
  SECONDS: 0,
  ON_DAY: 1,
  ON_LAST_DAY: 2,
  EVERY_X_MONTH: 3,
}

//Config - Tokens
const USDC = tokens.mainnet.USDC
const BAL = tokens.mainnet.BAL

//Config - Addresses
const WITHDRAWER_RECIPIENT = '0x7c68c42De679ffB0f16216154C996C354cF1161B'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    //Withdrawer USDC
    {
      from: DEPLOYER,
      name: 'withdrawer-usdc',
      version: dependency('core/tasks/primitives/withdrawer/v2.0.0'),
      config: {
        recipient: WITHDRAWER_RECIPIENT,
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023101700-environment-deploy', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('withdrawer-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [USDC],
          },
          timeLockConfig: {
            mode: TIMELOCK_MODE.SECONDS,
            frequency: 14 * 60 * 60 * 24, //14 days
            allowedAt: 1701954000, //Thursday, 7 December 2023 13:00:00
            window: 2 * 60 * 60 * 24, //2 days
          },
        },
      },
    },
    //Withdrawer BAL
    {
      from: DEPLOYER,
      name: 'withdrawer-bal',
      version: dependency('core/tasks/primitives/withdrawer/v2.0.0'),
      config: {
        recipient: WITHDRAWER_RECIPIENT,
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023101700-environment-deploy', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('withdrawer-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [BAL],
          },
          timeLockConfig: {
            mode: TIMELOCK_MODE.SECONDS,
            frequency: 14 * 60 * 60 * 24, //14 days
            allowedAt: 1701954000, //Thursday, 7 December 2023 13:00:00
            window: 2 * 60 * 60 * 24, //2 days
          },
        },
      },
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'smart-vault'),
          revokes: [
            {
              who: dependency('2023101700-environment-deploy', 'withdrawer'),
              what: 'withdraw',
            },
            {
              who: dependency('2023101700-environment-deploy', 'withdrawer'),
              what: 'updateBalanceConnector',
            },
          ],
          grants: [
            {
              who: dependency('withdrawer-usdc'),
              what: 'withdraw',
              params: [],
            },
            {
              who: dependency('withdrawer-usdc'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('withdrawer-bal'),
              what: 'withdraw',
              params: [],
            },
            {
              who: dependency('withdrawer-bal'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('2023101700-environment-deploy', 'withdrawer'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('withdrawer-usdc'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('withdrawer-bal'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
