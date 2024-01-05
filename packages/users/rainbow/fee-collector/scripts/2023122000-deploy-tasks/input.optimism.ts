import { OP } from '@mimic-fi/v3-authorizer'
import {
  balanceConnectorId,
  counterfactualDependency,
  dependency,
  DEPLOYER,
  EnvironmentUpdate,
  USERS_ADMIN,
} from '@mimic-fi/v3-deployments-lib'
import { bn, DAY, fp, NATIVE_TOKEN_ADDRESS, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TIMELOCK_MODE = {
  SECONDS: 0,
  ON_DAY: 1,
  ON_LAST_DAY: 2,
  EVERY_X_MONTH: 3,
}

//Config - Tokens
const USDC = tokens.optimism.USDC
const WRAPPED_NATIVE_TOKEN = tokens.optimism.WETH

//Config - Addresses
const MAINNET_DEPOSITOR_TASK = '0xe3B2aC218F1023cB5336A18411e68FbFfD6319C6'

//Config - Threshold
const USDC_CONVERT_THRESHOLD = bn(20e6) // 20 USDC

//Config - Gas
const STANDARD_GAS_PRICE_LIMIT = 0.5e9
const TX_COST_LIMIT_PCT = fp(0.05) // 5%
const TEN_TX_GAS = fp(0.00015) //10 tx
const MIN_WINDOW_GAS = TEN_TX_GAS // 10 tx
const MAX_WINDOW_GAS = TEN_TX_GAS.mul(10) //100 tx

//Config - Withdrawer Timelock
const BRIDGER_TIMELOCK_MODE = TIMELOCK_MODE.ON_LAST_DAY //SECONDS
const BRIDGER_TIMELOCK_FREQUENCY = 1 //1 month
const BRIDGER_TIMELOCK_ALLOWED_AT = 1704024000 //12:00hs UTC
const BRIDGER_TIMELOCK_WINDOW = 2 * DAY //2 days

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    //Depositor: for manual transfers and testing purposes
    {
      from: DEPLOYER,
      name: 'depositor',
      version: dependency('core/tasks/primitives/depositor/v2.1.0'),
      config: {
        tokensSource: counterfactualDependency('depositor'),
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023121100-environment-deploy', 'smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('swapper-connection'),
          },
          gasLimitConfig: {
            txCostLimitPct: TX_COST_LIMIT_PCT,
          },
          tokenIndexConfig: {
            acceptanceType: 0, //Deny list
            tokens: [],
          },
        },
      },
    },
    //Wrapper: wraps native tokens
    {
      from: DEPLOYER,
      name: 'wrapper',
      version: dependency('core/tasks/primitives/wrapper/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023121100-environment-deploy', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
            nextBalanceConnectorId: balanceConnectorId('wrapper-handle-over-connection'),
          },
          gasLimitConfig: {
            txCostLimitPct: TX_COST_LIMIT_PCT,
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [NATIVE_TOKEN_ADDRESS],
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
    //Handle over: moves exited bpt to be swapped
    {
      from: DEPLOYER,
      name: 'wrapper-handle-over',
      version: dependency('core/tasks/primitives/handle-over/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023121100-environment-deploy', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('wrapper-handle-over-connection'),
            nextBalanceConnectorId: balanceConnectorId('swapper-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [WRAPPED_NATIVE_TOKEN],
          },
        },
      },
    },
    //1inch Swapper: swap assets using 1inch dex aggregator
    {
      from: DEPLOYER,
      name: '1inch-swapper',
      version: dependency('core/tasks/swap/1inch-v5/v2.0.0'),
      config: {
        baseSwapConfig: {
          connector: dependency('core/connectors/1inch-v5/v1.0.0'),
          tokenOut: USDC,
          maxSlippage: fp(0.02), //2%
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('2023121100-environment-deploy', 'smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
              nextBalanceConnectorId: balanceConnectorId('bridger-connection'),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenIndexConfig: {
              acceptanceType: 0,
              tokens: [USDC],
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
    //Handle over: moves USDC to be bridged
    {
      from: DEPLOYER,
      name: 'usdc-handle-over',
      version: dependency('core/tasks/primitives/handle-over/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023121100-environment-deploy', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
            nextBalanceConnectorId: balanceConnectorId('bridger-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    //Bridger by time: makes sure that by the end of the period, it bridges everything
    {
      from: DEPLOYER,
      name: 'wormhole-bridger',
      version: dependency('core/tasks/bridge/wormhole/v2.0.0'),
      config: {
        baseBridgeConfig: {
          connector: dependency('core/connectors/wormhole/v1.0.0'),
          recipient: MAINNET_DEPOSITOR_TASK,
          destinationChain: 1, // mainnet
          maxSlippage: fp(0.02), //2%
          maxFee: {
            token: USDC,
            amount: fp(0.02), //2%
          },
          customDestinationChains: [],
          customMaxSlippages: [],
          customMaxFees: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('2023121100-environment-deploy', 'smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('bridger-connection'),
            },
            tokenIndexConfig: {
              acceptanceType: 1,
              tokens: [USDC],
            },
            timeLockConfig: {
              mode: BRIDGER_TIMELOCK_MODE,
              frequency: BRIDGER_TIMELOCK_FREQUENCY,
              allowedAt: BRIDGER_TIMELOCK_ALLOWED_AT,
              window: BRIDGER_TIMELOCK_WINDOW,
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: USDC,
                min: USDC_CONVERT_THRESHOLD.mul(2),
                max: 0,
              },
            },
          },
        },
      },
    },
    //Relayer Funder Swapper: swaps assets into native wrapped token to fund the relayer
    {
      from: DEPLOYER,
      name: 'relayer-funder-swapper',
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
              smartVault: dependency('2023121100-environment-deploy', 'smart-vault'),
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
    //Relayer Funder Unwrapper: unwraps wrapped native token
    {
      from: DEPLOYER,
      name: 'relayer-funder-unwrapper',
      version: dependency('core/tasks/primitives/unwrapper/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023121100-environment-deploy', 'smart-vault'),
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
    //Relayer Depositor: transfer and funds the relayer
    {
      from: DEPLOYER,
      name: 'relayer-depositor',
      version: dependency('core/tasks/relayer/depositor/v2.0.0'),
      args: [dependency('core/relayer/v1.1.0')],
      config: {
        baseConfig: {
          smartVault: dependency('2023121100-environment-deploy', 'smart-vault'),
          previousBalanceConnectorId: balanceConnectorId('relayer-depositor'),
        },
        gasLimitConfig: {
          gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
        },
        tokenIndexConfig: {
          acceptanceType: 1,
          tokens: [NATIVE_TOKEN_ADDRESS],
        },
      },
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023121100-environment-deploy', 'smart-vault'),
          revokes: [],
          grants: [
            {
              who: dependency('depositor'),
              what: 'collect',
              params: [],
            },
            {
              who: dependency('depositor'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('wrapper'),
              what: 'wrap',
              params: [],
            },
            {
              who: dependency('wrapper'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('wrapper-handle-over'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('1inch-swapper'),
              what: 'execute',
              params: [],
            },
            {
              who: dependency('1inch-swapper'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('usdc-handle-over'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('wormhole-bridger'),
              what: 'execute',
              params: [],
            },
            {
              who: dependency('wormhole-bridger'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('relayer-funder-swapper'),
              what: 'execute',
              params: [
                {
                  op: OP.EQ,
                  value: dependency('core/connectors/1inch-v5/v1.0.0'),
                },
              ],
            },
            {
              who: dependency('relayer-funder-swapper'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('relayer-funder-unwrapper'),
              what: 'unwrap',
              params: [],
            },
            {
              who: dependency('relayer-funder-unwrapper'),
              what: 'updateBalanceConnector',
              params: [],
            },
            { who: dependency('relayer-depositor'), what: 'call', params: [] },
            {
              who: dependency('relayer-depositor'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('depositor'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('wrapper'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('wrapper-handle-over'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('1inch-swapper'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('usdc-handle-over'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('wormhole-bridger'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('relayer-funder-swapper'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('relayer-funder-unwrapper'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('relayer-depositor'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
