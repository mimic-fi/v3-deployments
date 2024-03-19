import {
  balanceConnectorId,
  counterfactualDependency,
  dependency,
  DEPLOYER,
  EnvironmentUpdate,
  MIMIC_V2_BOT,
  USERS_ADMIN,
} from '@mimic-fi/v3-deployments-lib'
import { bn, DAY, fp, HOUR, NATIVE_TOKEN_ADDRESS, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

/* eslint-disable no-secrets/no-secrets */
const TIMELOCK_MODE = {
  SECONDS: 0,
  ON_DAY: 1,
  ON_LAST_DAY: 2,
  EVERY_X_MONTH: 3,
}

//Config - Tokens
const USDC = tokens.zkevm.USDC
const WRAPPED_NATIVE_TOKEN = tokens.zkevm.WETH

//Config - Addresses
const MAINNET_DEPOSITOR_TASK = '0xDFC4457250804c2e701eB409cc664Da2C24595dB'
const PARASWAP_QUOTE_SIGNER = '0x6278c27cf5534f07fa8f1ab6188a155cb8750ffa'
const FEE_CLAIMER = ''
const HOP_ENTRY_POINT = '0xbd72882120508518FCba2AE58E134EceaD18d979' //Confirm

//Config - Threshold
const USDC_CONVERT_THRESHOLD = bn(100e18) // 100 USDC

//Config - Gas
const STANDARD_GAS_PRICE_LIMIT = 10e9
const TX_COST_LIMIT_PCT = fp(0.02) // 2%
const QUOTA = fp(0.0084)
const MIN_WINDOW_GAS = QUOTA
const MAX_WINDOW_GAS = QUOTA.mul(10)

//Config - Bridger Timelock
const BRIDGER_TIMELOCK_MODE = TIMELOCK_MODE.SECONDS //SECONDS
const BRIDGER_TIMELOCK_FREQUENCY = 2419200 //28 days
const BRIDGER_TIMELOCK_ALLOWED_AT = 1701064800 //Monday, 27 November 2023 6:00:00
const BRIDGER_TIMELOCK_WINDOW = 2 * DAY //2 days

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    //Depositor: for manual transfers and testing purposes
    {
      from: DEPLOYER,
      name: 'depositor-v2',
      version: dependency('core/tasks/primitives/depositor/v2.1.1'),
      config: {
        tokensSource: counterfactualDependency('depositor-v2'),
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023111700-environment-deploy', 'smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('swapper-connection'),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
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
    //Asset Collector: collect assets from external source
    {
      from: DEPLOYER,
      name: 'asset-collector-v2',
      version: 'ParaswapV6Claimer',
      initialize: 'initializeParaswapV6Claimer',
      args: [FEE_CLAIMER],
      config: {
        baseConfig: {
          smartVault: dependency('2023111700-environment-deploy', 'smart-vault'),
          nextBalanceConnectorId: balanceConnectorId('swapper-connection'),
        },
        gasLimitConfig: {
          txCostLimitPct: TX_COST_LIMIT_PCT,
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
    //Wrapper: wraps native tokens
    {
      from: DEPLOYER,
      name: 'wrapper-v2',
      version: dependency('core/tasks/primitives/wrapper/v2.0.1'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023111700-environment-deploy', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
            nextBalanceConnectorId: balanceConnectorId('bridger-connection'),
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
    //Handle over: moves wrapped native to be bridged
    {
      from: DEPLOYER,
      name: 'wrapped-native-token-handle-over-v2',
      version: dependency('core/tasks/primitives/handle-over/v2.0.1'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023111700-environment-deploy', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
            nextBalanceConnectorId: balanceConnectorId('bridger-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [WRAPPED_NATIVE_TOKEN],
          },
        },
      },
    },
    //Paraswap Swapper: swap assets using Paraswap dex aggregator
    {
      from: DEPLOYER,
      name: 'paraswap-swapper-v2',
      version: dependency('core/tasks/swap/paraswap-v5/v2.1.1'),
      config: {
        quoteSigner: PARASWAP_QUOTE_SIGNER,
        baseSwapConfig: {
          connector: dependency('core/connectors/paraswap-v5/v1.0.0'),
          tokenOut: WRAPPED_NATIVE_TOKEN,
          maxSlippage: fp(0.02), //2%
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('2023111700-environment-deploy', 'smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
              nextBalanceConnectorId: balanceConnectorId('bridger-connection'),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenIndexConfig: {
              acceptanceType: 0, //Deny list
              tokens: [WRAPPED_NATIVE_TOKEN, NATIVE_TOKEN_ADDRESS],
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
    //Bridger
    {
      from: DEPLOYER,
      name: 'hop-bridger',
      version: dependency('core/tasks/bridge/hop/v2.0.1'),
      config: {
        baseBridgeConfig: {
          connector: dependency('core/connectors/hop/v1.0.0'),
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
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('bridger-connection'),
            },
            tokenIndexConfig: {
              acceptanceType: 1,
              tokens: [WRAPPED_NATIVE_TOKEN],
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
        relayer: MIMIC_V2_BOT.address,
        maxDeadline: 2 * HOUR,
        tokenHopEntrypoints: [
          {
            entrypoint: WRAPPED_NATIVE_TOKEN,
            token: HOP_ENTRY_POINT,
          },
        ],
      },
    },
    //Relayer Funder Unwrapper: unwraps wrapped native token
    {
      from: DEPLOYER,
      name: 'relayer-funder-unwrapper-v2',
      version: dependency('core/tasks/relayer/unwrapper/v2.0.1'),
      initialize: 'initializeUnwrapperRelayerFunder',
      args: [dependency('core/relayer/v1.1.0')],
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023111700-environment-deploy', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('bridger-connection'),
            nextBalanceConnectorId: balanceConnectorId('relayer-depositor-v2'),
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
    //Relayer Depositor: transfer and funds the relayer
    {
      from: DEPLOYER,
      name: 'relayer-depositor-v2',
      version: dependency('core/tasks/relayer/depositor/v2.0.1'),
      args: [dependency('core/relayer/v1.1.0')],
      config: {
        baseConfig: {
          smartVault: dependency('2023111700-environment-deploy', 'smart-vault'),
          previousBalanceConnectorId: balanceConnectorId('relayer-depositor-v2'),
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
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'smart-vault'),
          revokes: [],
          grants: [
            { who: dependency('depositor-v2'), what: 'collect', params: [] },
            {
              who: dependency('depositor-v2'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('asset-collector-v2'),
              what: 'call',
              params: [],
            },
            {
              who: dependency('asset-collector-v2'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('wrapper-v2'),
              what: 'wrap',
              params: [],
            },
            {
              who: dependency('wrapper-v2'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('wrapped-native-token-handle-over-v2'),
              what: 'updateBalanceConnector',
              params: [],
            },
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
              who: dependency('connext-bridger'),
              what: 'execute',
              params: [],
            },
            {
              who: dependency('connext-bridger'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('relayer-funder-unwrapper-v2'),
              what: 'unwrap',
              params: [],
            },
            {
              who: dependency('relayer-funder-unwrapper-v2'),
              what: 'updateBalanceConnector',
              params: [],
            },
            { who: dependency('relayer-depositor-v2'), what: 'call', params: [] },
            {
              who: dependency('relayer-depositor-v2'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('depositor-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('asset-collector-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('wrapper-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('wrapped-native-token-handle-over-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('paraswap-swapper-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('connext-bridger'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('relayer-funder-unwrapper-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('relayer-depositor-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        //Revoke
        {
          where: dependency('2023111700-environment-deploy', 'depositor'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'asset-collector'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'wrapper'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'wrapped-native-token-handle-over'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'paraswap-swapper'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'withdrawer'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'relayer-funder-unwrapper'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'relayer-depositor'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
