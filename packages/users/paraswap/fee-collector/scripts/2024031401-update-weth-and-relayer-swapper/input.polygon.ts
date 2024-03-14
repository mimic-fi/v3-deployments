import { OP } from '@mimic-fi/v3-authorizer'
import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const WRAPPED_NATIVE_TOKEN = tokens.polygon.WMATIC
const WETH = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'

//Config - Gas
const STANDARD_GAS_PRICE_LIMIT = 200e9
const TEN_TX_GAS = fp(0.53) //10 tx
const MIN_WINDOW_GAS = TEN_TX_GAS // 10 tx
const MAX_WINDOW_GAS = TEN_TX_GAS.mul(10) //100 tx

//Config - Addresses
const PARASWAP_QUOTE_SIGNER = '0x6278c27cf5534f07fa8f1ab6188a155cb8750ffa'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024022002-deploy-new-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024022002-deploy-new-environments', 'paraswap-swapper-v2'),
          grants: [
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] },
            { who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] },
          ],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024022002-deploy-new-environments', 'paraswap-swapper-v2'),
      method: 'setDefaultTokenOut',
      args: [WETH],
    },
    {
      from: DEPLOYER,
      target: dependency('2024022002-deploy-new-environments', 'paraswap-swapper-v2'),
      method: 'setTokensAcceptanceList',
      args: [
        [WRAPPED_NATIVE_TOKEN, WETH],
        [false, true],
      ],
    },
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
              smartVault: dependency('2024022002-deploy-new-environments', 'smart-vault'),
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
    //Relayer Funder Unwrapper: unwraps wrapped native token
    {
      from: DEPLOYER,
      name: 'relayer-funder-unwrapper-v3',
      version: dependency('core/tasks/primitives/unwrapper/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2024022002-deploy-new-environments', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('relayer-funder-unwrapper'),
            nextBalanceConnectorId: balanceConnectorId('relayer-depositor'),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [WRAPPED_NATIVE_TOKEN],
          },
        },
      },
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024022002-deploy-new-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024022002-deploy-new-environments', 'smart-vault'),
          revokes: [],
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
            {
              who: dependency('relayer-funder-unwrapper-v3'),
              what: 'unwrap',
              params: [],
            },
            {
              who: dependency('relayer-funder-unwrapper-v3'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('relayer-funder-swapper-v3'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('relayer-funder-unwrapper-v3'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('2024022002-deploy-new-environments', 'relayer-funder-unwrapper-v2'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },

        {
          where: dependency('2024022002-deploy-new-environments', 'paraswap-swapper-v2'),
          revokes: [
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList' },
            { who: DEPLOYER.address, what: 'setDefaultTokenOut' },
          ],
          grants: [],
        },
      ],
    },
  ],
}

export default update
