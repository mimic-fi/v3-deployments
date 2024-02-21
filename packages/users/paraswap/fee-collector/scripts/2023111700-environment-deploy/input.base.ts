import {
  balanceConnectorId,
  counterfactualDependency,
  dependency,
  DEPLOYER,
  EnvironmentDeployment,
  MIMIC_V2_BOT,
  PROTOCOL_ADMIN,
  USERS_ADMIN,
} from '@mimic-fi/v3-deployments-lib'
import { bn, chainlink, DAY, fp, NATIVE_TOKEN_ADDRESS, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TIMELOCK_MODE = {
  SECONDS: 0,
  ON_DAY: 1,
  ON_LAST_DAY: 2,
}

//Config - Tokens
const USDC = tokens.base.USDC
const WRAPPED_NATIVE_TOKEN = tokens.base.WETH

//Config - Addresses
const OWNER = '0x65136b3E4f012e4c13Aff0926091E2eadCFEdB42'
const MAINNET_DEPOSITOR_TASK = '0x249dD0B25FbbA421303f58B7E443b469E45fe3C0'
const FEE_CLAIMER = '0x9aaB4B24541af30fD72784ED98D8756ac0eFb3C7'
const PARASWAP_QUOTE_SIGNER = '0x6278c27cf5534f07fa8f1ab6188a155cb8750ffa'

//Config - Threshold
const USDC_CONVERT_THRESHOLD = bn(100000000) // 100 USDC

//Config - Gas
const STANDARD_GAS_PRICE_LIMIT = 200e9
const TX_COST_LIMIT_PCT = fp(0.02) // 2%
const QUOTA = fp(0.000135)
const MIN_WINDOW_GAS = QUOTA
const MAX_WINDOW_GAS = QUOTA.mul(10)

//Config - To USDC Swapper Timelock
const WETH_TO_USDC_SWAPPER_TIMELOCK_MODE = TIMELOCK_MODE.SECONDS //SECONDS
const WETH_TO_USDC_SWAPPER_TIMELOCK_FREQUENCY = 2419200 //28 days
const WETH_TO_USDC_SWAPPER_TIMELOCK_ALLOWED_AT = 1701054000 //Monday, 27 November 2023 3:00:00
const WETH_TO_USDC_SWAPPER_TIMELOCK_WINDOW = 2 * DAY //2 days

//Config - Bridger Timelock
const BRIDGER_TIMELOCK_MODE = TIMELOCK_MODE.SECONDS //SECONDS
const BRIDGER_TIMELOCK_FREQUENCY = 2419200 //28 days
const BRIDGER_TIMELOCK_ALLOWED_AT = 1701064800 //Monday, 27 November 2023 6:00:00
const BRIDGER_TIMELOCK_WINDOW = 2 * DAY //2 days

//Config - Fee
const FEE_PCT = fp(0.02) // 2%

export default deployment

const deployment: EnvironmentDeployment = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  authorizer: {
    from: DEPLOYER,
    name: 'authorizer',
    version: dependency('core/authorizer/v1.1.0'),
    owners: [OWNER, USERS_ADMIN.safe],
  },
  priceOracle: {
    from: DEPLOYER,
    name: 'price-oracle',
    version: dependency('core/price-oracle/v1.0.0'),
    authorizer: dependency('authorizer'),
    signer: MIMIC_V2_BOT.address,
    pivot: chainlink.denominations.USD,
    feeds: [],
  },
  smartVaults: [
    {
      from: DEPLOYER,
      name: 'smart-vault',
      version: dependency('core/smart-vault/v1.0.0'),
      authorizer: dependency('authorizer'),
      priceOracle: dependency('price-oracle'),
    },
  ],
  tasks: [
    //Depositor: for manual transfers and testing purposes
    {
      from: DEPLOYER,
      name: 'depositor',
      version: dependency('core/tasks/primitives/depositor/v2.0.0'),
      config: {
        tokensSource: counterfactualDependency('depositor'),
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('swapper-connection'),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
        },
      },
    },
    //Asset Collector: collect assets from external source
    {
      from: DEPLOYER,
      name: 'asset-collector',
      version: 'ParaswapClaimer',
      initialize: 'initializeParaswapClaimer',
      args: [FEE_CLAIMER],
      config: {
        baseConfig: {
          smartVault: dependency('smart-vault'),
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
      name: 'wrapper',
      version: dependency('core/tasks/primitives/wrapper/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
            nextBalanceConnectorId: balanceConnectorId('weth-to-usdc-swapper-connection'),
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
      name: 'wrapped-native-token-handle-over',
      version: dependency('core/tasks/primitives/handle-over/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
            nextBalanceConnectorId: balanceConnectorId('weth-to-usdc-swapper-connection'),
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
      name: 'paraswap-swapper',
      version: dependency('core/tasks/swap/paraswap-v5/v2.0.0'),
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
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
              nextBalanceConnectorId: balanceConnectorId('weth-to-usdc-swapper-connection'),
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
    //Paraswap Swapper: swap assets using Paraswap dex aggregator
    {
      from: DEPLOYER,
      name: 'paraswap-weth-to-usdc-swapper',
      version: dependency('core/tasks/swap/paraswap-v5/v2.0.0'),
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
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('weth-to-usdc-swapper-connection'),
              nextBalanceConnectorId: balanceConnectorId('bridger-connection'),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenIndexConfig: {
              acceptanceType: 1, //Allow list
              tokens: [WRAPPED_NATIVE_TOKEN],
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
              smartVault: dependency('smart-vault'),
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
          },
        },
      },
    },
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
            smartVault: dependency('smart-vault'),
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
    //Relayer Depositor: transfer and funds the relayer
    {
      from: DEPLOYER,
      name: 'relayer-depositor',
      version: dependency('core/tasks/relayer/depositor/v2.0.0'),
      args: [dependency('core/relayer/v1.1.0')],
      config: {
        baseConfig: {
          smartVault: dependency('smart-vault'),
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
  ],
  permissions: {
    from: USERS_ADMIN,
    authorizer: dependency('authorizer'),
    changes: [
      {
        where: dependency('smart-vault'),
        revokes: [],
        grants: [
          { who: dependency('depositor'), what: 'collect', params: [] },
          {
            who: dependency('depositor'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('asset-collector'),
            what: 'call',
            params: [],
          },
          {
            who: dependency('asset-collector'),
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
            who: dependency('wrapped-native-token-handle-over'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('paraswap-swapper'),
            what: 'execute',
            params: [],
          },
          {
            who: dependency('paraswap-swapper'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('paraswap-weth-to-usdc-swapper'),
            what: 'execute',
            params: [],
          },
          {
            who: dependency('paraswap-weth-to-usdc-swapper'),
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
        where: dependency('asset-collector'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('wrapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('wrapped-native-token-handle-over'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('paraswap-swapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('paraswap-weth-to-usdc-swapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('wormhole-bridger'),
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
  feeSettings: {
    from: PROTOCOL_ADMIN,
    smartVault: dependency('smart-vault'),
    feeController: dependency('core/fee-controller/v1.0.0'),
    maxFeePct: fp(0.02), // 2%
    feePct: FEE_PCT,
  },
  relayerSettings: {
    from: PROTOCOL_ADMIN,
    smartVault: dependency('smart-vault'),
    relayer: dependency('core/relayer/v1.1.0'),
    quota: QUOTA,
  },
}
