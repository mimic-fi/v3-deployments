import { OP } from '@mimic-fi/v3-authorizer'
import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const USDC = tokens.avalanche.USDC
const WRAPPED_NATIVE_TOKEN = tokens.avalanche.WAVAX

//Config - Gas
const STANDARD_GAS_PRICE_LIMIT = 50e9
const QUOTA = fp(0.148)
const MIN_WINDOW_GAS = QUOTA
const MAX_WINDOW_GAS = QUOTA.mul(10)

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    //Relayer Funder Swapper: swaps assets into native wrapped token to fund the relayer
    {
      from: DEPLOYER,
      name: 'relayer-funder-swapper-v2',
      version: dependency('core/tasks/relayer/1inch-v5-swapper/v2.0.0'),
      initialize: 'initializeOneInchV5RelayerFunder',
      args: [dependency('core/relayer/v1.1.0')],
      config: {
        baseSwapConfig: {
          connector: dependency('core/connectors/1inch-v5/v1.0.0'),
          tokenOut: WRAPPED_NATIVE_TOKEN,
          maxSlippage: fp(0.02),
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('2023101700-environment-deploy', 'smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('bridger-connection'),
              nextBalanceConnectorId: balanceConnectorId('relayer-funder-unwrapper'),
            },
            gasLimitConfig: {
              gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
            },
            tokenIndexConfig: {
              acceptanceType: 1,
              tokens: [USDC],
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
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'smart-vault'),
          revokes: [
            {
              who: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
              what: 'execute',
            },
            {
              who: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
              what: 'updateBalanceConnector',
            },
          ],
          grants: [
            {
              who: dependency('relayer-funder-swapper-v2'),
              what: 'execute',
              params: [
                {
                  op: OP.EQ,
                  value: dependency('core/connectors/1inch-v5/v1.0.0'),
                },
              ],
            },
            {
              who: dependency('relayer-funder-swapper-v2'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('relayer-funder-swapper-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
