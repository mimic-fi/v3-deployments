import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, DAY, fp, NATIVE_TOKEN_ADDRESS, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TIMELOCK_MODE = {
  SECONDS: 0,
  ON_DAY: 1,
  ON_LAST_DAY: 2,
  EVERY_X_MONTH: 3,
}

//Config - Tokens
const USDC = tokens.fantom.USDC
const WETH = '0x695921034f0387eAc4e11620EE91b1b15A6A09fE' //ZeroLayer WETH

//Config - Addresses
const PARASWAP_QUOTE_SIGNER = '0x6278c27cf5534f07fa8f1ab6188a155cb8750ffa'

//Config - Threshold
const USDC_CONVERT_THRESHOLD = bn(100e6) // 100 USDC

//Config - Gas
const TX_COST_LIMIT_PCT = fp(0.05) // 5%

//Config - To USDC Swapper Timelock
const WETH_TO_USDC_SWAPPER_TIMELOCK_MODE = TIMELOCK_MODE.SECONDS //SECONDS
const WETH_TO_USDC_SWAPPER_TIMELOCK_FREQUENCY = 2419200 //28 days
const WETH_TO_USDC_SWAPPER_TIMELOCK_ALLOWED_AT = 1701054000 //Monday, 27 November 2023 3:00:00
const WETH_TO_USDC_SWAPPER_TIMELOCK_WINDOW = 2 * DAY //2 days

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    //Paraswap Swapper: swap assets using Paraswap dex aggregator
    {
      from: DEPLOYER,
      name: 'paraswap-swapper-v2',
      version: dependency('core/tasks/swap/paraswap-v5/v2.1.0'),
      config: {
        quoteSigner: PARASWAP_QUOTE_SIGNER,
        baseSwapConfig: {
          connector: dependency('core/connectors/paraswap-v5/v1.0.0'),
          tokenOut: WETH,
          maxSlippage: fp(0.02), //2%
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('2023111700-environment-deploy', 'smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
              nextBalanceConnectorId: balanceConnectorId('weth-to-usdc-swapper-connection'),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenIndexConfig: {
              acceptanceType: 0, //Deny list
              tokens: [WETH, NATIVE_TOKEN_ADDRESS],
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: USDC,
                min: USDC_CONVERT_THRESHOLD,
                max: 0,
              },
            },
          },
        },
      },
    },
    {
      from: DEPLOYER,
      name: 'paraswap-weth-to-usdc-swapper-v2',
      version: dependency('core/tasks/swap/paraswap-v5/v2.1.0'),
      config: {
        quoteSigner: PARASWAP_QUOTE_SIGNER,
        baseSwapConfig: {
          connector: dependency('core/connectors/paraswap-v5/v1.0.0'),
          tokenOut: USDC,
          maxSlippage: fp(0.02), //2%
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('2023111700-environment-deploy', 'smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('weth-to-usdc-swapper-connection'),
              nextBalanceConnectorId: balanceConnectorId('bridger-connection'),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenIndexConfig: {
              acceptanceType: 1, //Allow list
              tokens: [WETH],
            },
            timeLockConfig: {
              mode: WETH_TO_USDC_SWAPPER_TIMELOCK_MODE,
              frequency: WETH_TO_USDC_SWAPPER_TIMELOCK_FREQUENCY,
              allowedAt: WETH_TO_USDC_SWAPPER_TIMELOCK_ALLOWED_AT,
              window: WETH_TO_USDC_SWAPPER_TIMELOCK_WINDOW,
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
              who: dependency('2023111700-environment-deploy', 'paraswap-swapper'),
              what: 'execute',
            },
            {
              who: dependency('2023111700-environment-deploy', 'paraswap-swapper'),
              what: 'updateBalanceConnector',
            },
            {
              who: dependency('2023111700-environment-deploy', 'paraswap-weth-to-usdc-swapper'),
              what: 'execute',
            },
            {
              who: dependency('2023111700-environment-deploy', 'paraswap-weth-to-usdc-swapper'),
              what: 'updateBalanceConnector',
            },
          ],
          grants: [
            {
              who: dependency('paraswap-swapper-v2'),
              what: 'execute',
              params: [],
            },
            {
              who: dependency('paraswap-swapper-v2'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('paraswap-weth-to-usdc-swapper-v2'),
              what: 'execute',
              params: [],
            },
            {
              who: dependency('paraswap-weth-to-usdc-swapper-v2'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('2023111700-environment-deploy', 'paraswap-swapper'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('paraswap-swapper-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('2023111700-environment-deploy', 'paraswap-weth-to-usdc-swapper'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('paraswap-weth-to-usdc-swapper-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
