import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const WRAPPED_NATIVE_TOKEN = tokens.base.WETH

//Config - Gas
const STANDARD_GAS_PRICE_LIMIT = 200e9
const QUOTA = fp(0.000135)
const MIN_WINDOW_GAS = QUOTA
const MAX_WINDOW_GAS = QUOTA.mul(10)

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    //Relayer Funder Unwrapper: unwraps wrapped native token
    {
      from: DEPLOYER,
      name: 'relayer-funder-unwrapper-v2',
      version: dependency('core/tasks/relayer/unwrapper/v2.0.0'),
      initialize: 'initializeUnwrapperRelayerFunder',
      args: [dependency('core/relayer/v1.1.0')],
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023111700-environment-deploy', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('weth-to-usdc-swapper-connection'),
            nextBalanceConnectorId: balanceConnectorId('relayer-depositor'),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [WRAPPED_NATIVE_TOKEN],
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: WRAPPED_NATIVE_TOKEN,
              min: MIN_WINDOW_GAS,
              max: MAX_WINDOW_GAS,
            },
          },
        },
      },
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'smart-vault'),
          revokes: [
            {
              who: dependency('2023111700-environment-deploy', 'relayer-funder-unwrapper'),
              what: 'execute',
            },
            {
              who: dependency('2023111700-environment-deploy', 'relayer-funder-unwrapper'),
              what: 'updateBalanceConnector',
            },
          ],
          grants: [
            {
              who: dependency('relayer-funder-unwrapper-v2'),
              what: 'execute',
              params: [],
            },
            {
              who: dependency('relayer-funder-unwrapper-v2'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('2023111700-environment-deploy', 'relayer-funder-unwrapper'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('relayer-funder-unwrapper-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
