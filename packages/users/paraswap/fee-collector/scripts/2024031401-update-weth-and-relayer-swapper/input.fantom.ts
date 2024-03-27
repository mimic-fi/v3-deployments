import { OP } from '@mimic-fi/v3-authorizer'
import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const WRAPPED_NATIVE_TOKEN = tokens.fantom.WFTM
const WETH = '0x695921034f0387eAc4e11620EE91b1b15A6A09fE' //ZeroLayer WETH

//Config - Gas
const STANDARD_GAS_PRICE_LIMIT = 200e9
const QUOTA = fp(0.79)
const MIN_WINDOW_GAS = QUOTA
const MAX_WINDOW_GAS = QUOTA.mul(10)

//Config - Addresses
const PARASWAP_QUOTE_SIGNER = '0x6278c27cf5534f07fa8f1ab6188a155cb8750ffa'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    //Relayer Funder Swapper: swaps assets into native wrapped token to fund the relayer
    {
      from: DEPLOYER,
      name: 'relayer-funder-swapper-v3',
      version: dependency('core/tasks/relayer/paraswap-v5-swapper/v2.0.1'),
      initialize: 'initializeParaswapV5RelayerFunder',
      args: [dependency('core/relayer/v1.1.0')],
      config: {
        quoteSigner: PARASWAP_QUOTE_SIGNER,
        baseSwapConfig: {
          connector: dependency('core/connectors/paraswap-v5/v1.0.0'),
          tokenOut: WRAPPED_NATIVE_TOKEN,
          maxSlippage: fp(0.02),
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('2023111700-environment-deploy', 'smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('weth-to-usdc-swapper-connection'),
              nextBalanceConnectorId: balanceConnectorId('relayer-funder-unwrapper'),
            },
            gasLimitConfig: {
              gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
            },
            tokenIndexConfig: {
              acceptanceType: 1,
              tokens: [WETH],
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
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'smart-vault'),
          revokes: [
            {
              who: dependency('2023120400-replace-relayer-funder-tasks', 'relayer-funder-swapper-v2'),
              what: 'execute',
            },
            {
              who: dependency('2023120400-replace-relayer-funder-tasks', 'relayer-funder-swapper-v2'),
              what: 'updateBalanceConnector',
            },
          ],
          grants: [
            {
              who: dependency('relayer-funder-swapper-v3'),
              what: 'execute',
              params: [
                {
                  op: OP.EQ,
                  value: dependency('core/connectors/1inch-v5/v1.0.0'),
                },
              ],
            },
            {
              who: dependency('relayer-funder-swapper-v3'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('2023120400-replace-relayer-funder-tasks', 'relayer-funder-swapper-v2'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('relayer-funder-swapper-v3'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
