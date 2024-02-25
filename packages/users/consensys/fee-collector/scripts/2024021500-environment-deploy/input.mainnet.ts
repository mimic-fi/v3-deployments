import { OP } from '@mimic-fi/v3-authorizer'
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
import { bn, chainlink, fp, NATIVE_TOKEN_ADDRESS, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const USDC = tokens.mainnet.USDC
const WRAPPED_NATIVE_TOKEN = tokens.mainnet.WETH

//Config - Addresses
const WITHDRAWER_RECIPIENT = '0x99983ed1a64540fb22582192d615082889547500'

//Config - Threshold
const USDC_CONVERT_THRESHOLD = bn(10e6) // 10 USDC

//Config - Gas
const STANDARD_GAS_PRICE_LIMIT = 100e9
const TX_COST_LIMIT_PCT = fp(0.05) // 5%
const TEN_TX_GAS = fp(0.0796) //10 tx
const QUOTA = TEN_TX_GAS.mul(10) //100 tx
const MIN_WINDOW_GAS = TEN_TX_GAS // 10 tx
const MAX_WINDOW_GAS = TEN_TX_GAS.mul(10) //100 tx

//Config - Fee
const FEE_PCT = fp(0.009) // 0.9%

const deployment: EnvironmentDeployment = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'consensys-fee-collector',
  authorizer: {
    from: DEPLOYER,
    name: 'authorizer',
    version: dependency('core/authorizer/v1.1.0'),
    owners: [USERS_ADMIN.safe],
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
    //Depositor: Avalanche
    {
      from: DEPLOYER,
      name: 'avalanche-depositor',
      version: dependency('core/tasks/primitives/depositor/v2.1.0'),
      config: {
        tokensSource: counterfactualDependency('avalanche-depositor'),
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('withdrawer-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    //Depositor: for manual transfers and testing purposes
    {
      from: DEPLOYER,
      name: 'depositor',
      version: dependency('core/tasks/primitives/depositor/v2.1.0'),
      config: {
        tokensSource: counterfactualDependency('depositor'),
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
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
            smartVault: dependency('smart-vault'),
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
            smartVault: dependency('smart-vault'),
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
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
              nextBalanceConnectorId: balanceConnectorId('withdrawer-connection'),
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
    //Paraswap Swapper: swap assets using Paraswap dex aggregator
    {
      from: DEPLOYER,
      name: 'paraswap-swapper',
      version: dependency('core/tasks/swap/paraswap-v5/v2.1.0'),
      config: {
        quoteSigner: '0x6278c27cf5534f07fa8f1ab6188a155cb8750ffa',
        baseSwapConfig: {
          connector: dependency('core/connectors/paraswap-v5/v1.0.0'),
          tokenOut: USDC,
          maxSlippage: fp(0.02), //2%
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
              nextBalanceConnectorId: balanceConnectorId('withdrawer-connection'),
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
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
            nextBalanceConnectorId: balanceConnectorId('withdrawer-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    //Withdrawer USDC
    {
      from: DEPLOYER,
      name: 'withdrawer',
      version: dependency('core/tasks/primitives/withdrawer/v2.0.0'),
      config: {
        recipient: WITHDRAWER_RECIPIENT,
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('withdrawer-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1,
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
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('withdrawer-connection'),
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
            smartVault: dependency('smart-vault'),
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
          {
            who: dependency('avalanche-depositor'),
            what: 'collect',
            params: [],
          },
          {
            who: dependency('avalanche-depositor'),
            what: 'updateBalanceConnector',
            params: [],
          },
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
            who: dependency('usdc-handle-over'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('withdrawer'),
            what: 'withdraw',
            params: [],
          },
          {
            who: dependency('withdrawer'),
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
        where: dependency('avalanche-depositor'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
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
        where: dependency('paraswap-swapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('usdc-handle-over'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('withdrawer'),
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

export default deployment
