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
import { bn, chainlink, fp, NATIVE_TOKEN_ADDRESS, tokens, ZERO_ADDRESS } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const USDC = tokens.mainnet.USDC
const BAL = tokens.mainnet.BAL
const WRAPPED_NATIVE_TOKEN = tokens.mainnet.WETH

//Config - Addresses
const OWNER = '0xc38c5f97B34E175FFd35407fc91a937300E33860'
const PROTOCOL_FEE_WITHDRAWER = '0x5ef4c5352882b10893b70DbcaA0C000965bd23c5'
const PROTOCOL_FEES_COLLECTOR = '0xce88686553686DA562CE7Cea497CE749DA109f9F'
const WITHDRAWER_RECIPIENT = '0x7c68c42De679ffB0f16216154C996C354cF1161B'

//Config - Threshold
const USDC_THRESHOLD = bn(500000000) // 500 USDC

//Config - Gas
const STANDARD_GAS_PRICE_LIMIT = 100e9
const TX_COST_LIMIT_PCT = fp(0.05) // 5%
const QUOTA = fp(0.0796)
const MIN_WINDOW_GAS = QUOTA
const MAX_WINDOW_GAS = QUOTA.mul(7)

//Config - Fee
const FEE_PCT = fp(0.02) // 2%

const deployment: EnvironmentDeployment = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  authorizer: {
    from: DEPLOYER,
    name: 'authorizer',
    version: dependency('core/authorizer/v1.0.0'),
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
  smartVault: {
    from: DEPLOYER,
    name: 'smart-vault',
    version: dependency('core/smart-vault/v1.0.0'),
    authorizer: dependency('authorizer'),
    priceOracle: dependency('price-oracle'),
  },
  tasks: [
    //Depositor: Avalanche
    {
      from: DEPLOYER,
      name: 'avalanche-depositor',
      version: dependency('core/tasks/primitives/depositor/v2.0.0'),
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
    //Depositor: Base
    {
      from: DEPLOYER,
      name: 'base-depositor',
      version: dependency('core/tasks/primitives/depositor/v2.0.0'),
      config: {
        tokensSource: counterfactualDependency('base-depositor'),
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
    //Depositor: v2
    {
      from: DEPLOYER,
      name: 'v2-depositor',
      version: dependency('core/tasks/primitives/depositor/v2.0.0'),
      config: {
        tokensSource: counterfactualDependency('v2-depositor'),
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
          tokenIndexConfig: {
            acceptanceType: 0, //Deny list
            tokens: [],
          },
        },
      },
    },
    //Asset Collector: collect assets from external source
    {
      from: DEPLOYER,
      name: 'asset-collector-v2',
      version: 'BalancerClaimer',
      initialize: 'initializeBalancerClaimer',
      args: [PROTOCOL_FEE_WITHDRAWER, PROTOCOL_FEES_COLLECTOR],
      config: {
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
        tokenThresholdConfig: {
          defaultThreshold: {
            token: USDC,
            min: USDC_THRESHOLD,
            max: 0,
          },
        },
      },
    },
    //Bpt Exiter: exit bpt into underlying assets
    {
      from: DEPLOYER,
      name: 'bpt-exiter-v2',
      version: dependency('core/tasks/liquidity/balancer/bpt-exiter/v2.1.0'),
      config: {
        connector: dependency('core/connectors/balancer-v2-pool/v1.0.0'),
        maxSlippage: fp(0.02), //2%
        customMaxSlippages: [],
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
            nextBalanceConnectorId: balanceConnectorId('bpt-handle-over-connection'),
          },
          gasLimitConfig: {
            txCostLimitPct: TX_COST_LIMIT_PCT,
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: USDC,
              min: USDC_THRESHOLD,
              max: 0,
            },
          },
        },
      },
    },
    //Bpt Boosted Swapper: swap assets using 1inch dex aggregator
    {
      from: DEPLOYER,
      name: 'balancer-v2-boosted-swapper',
      version: dependency('core/tasks/swap/balancer-v2-boosted-swapper/v2.0.0'),
      config: {
        baseSwapConfig: {
          connector: dependency('core/connectors/balancer-v2-swap/v1.0.0'),
          tokenOut: ZERO_ADDRESS,
          maxSlippage: fp(0.02), //2%
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
              nextBalanceConnectorId: balanceConnectorId('bpt-handle-over-connection'),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: USDC,
                min: USDC_THRESHOLD,
                max: 0,
              },
            },
          },
        },
      },
    },
    //Bpt Linear Swapper: swap assets using 1inch dex aggregator
    {
      from: DEPLOYER,
      name: 'balancer-v2-linear-swapper',
      version: dependency('core/tasks/swap/balancer-v2-linear-swapper/v2.0.0'),
      config: {
        baseSwapConfig: {
          connector: dependency('core/connectors/balancer-v2-swap/v1.0.0'),
          tokenOut: ZERO_ADDRESS,
          maxSlippage: fp(0.02), //2%
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
              nextBalanceConnectorId: balanceConnectorId('bpt-handle-over-connection'),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: USDC,
                min: USDC_THRESHOLD,
                max: 0,
              },
            },
          },
        },
      },
    },
    //Handle over: moves exited bpt to be swapped
    {
      from: DEPLOYER,
      name: 'bpt-handle-over',
      version: dependency('core/tasks/primitives/handle-over/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('bpt-handle-over-connection'),
            nextBalanceConnectorId: balanceConnectorId('swapper-connection'),
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
                min: USDC_THRESHOLD,
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
      version: dependency('core/tasks/swap/paraswap-v5/v2.0.0'),
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
                min: USDC_THRESHOLD,
                max: 0,
              },
            },
          },
        },
      },
    },
    //Handle over: moves USDC and BAL to be bridged
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
            tokens: [USDC, BAL],
          },
        },
      },
    },
    //Withdrawer USDC and BAL
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
            tokens: [USDC, BAL],
          },
          timeLockConfig: {
            mode: 1, //SECONDS
            frequency: 14 * 60 * 60 * 24, //14 days
            allowedAt: 1699534800, //Thursday, 9 November 2023 13:00:00
            window: 2 * 60 * 60 * 24, //2 days
          },
        },
      },
    },
    //Relayer Funder Swapper: swaps assets into native wrapped token to fund the relayer
    {
      from: DEPLOYER,
      name: 'relayer-funder-swapper',
      version: dependency('core/tasks/swap/1inch-v5/v2.0.0'),
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
            who: dependency('base-depositor'),
            what: 'collect',
            params: [],
          },
          {
            who: dependency('base-depositor'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('v2-depositor'),
            what: 'collect',
            params: [],
          },
          {
            who: dependency('v2-depositor'),
            what: 'updateBalanceConnector',
            params: [],
          },
          { who: dependency('depositor'), what: 'collect', params: [] },
          {
            who: dependency('depositor'),
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
            who: dependency('bpt-exiter-v2'),
            what: 'call',
            params: [],
          },
          {
            who: dependency('bpt-exiter-v2'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('balancer-v2-boosted-swapper'),
            what: 'execute',
            params: [],
          },
          {
            who: dependency('balancer-v2-boosted-swapper'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('balancer-v2-linear-swapper'),
            what: 'execute',
            params: [],
          },
          {
            who: dependency('balancer-v2-linear-swapper'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('bpt-handle-over'),
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
        where: dependency('base-depositor'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('v2-depositor'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('depositor'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('asset-collector-v2'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('bpt-exiter-v2'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('balancer-v2-boosted-swapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('balancer-v2-linear-swapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('bpt-handle-over'),
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
