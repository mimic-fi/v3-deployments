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
import { bn, chainlink, fp, tokens, ZERO_ADDRESS } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const USDC = tokens.zkevm.USDC

//Config - Addresses
const PROTOCOL_FEE_WITHDRAWER = '0x230a59F4d9ADc147480f03B0D3fFfeCd56c3289a'
const PROTOCOL_FEES_COLLECTOR = '0xce88686553686DA562CE7Cea497CE749DA109f9F'

//Config - Threshold
const USDC_THRESHOLD = bn(100000000) // 100 USDC

//Config - Gas
const TX_COST_LIMIT_PCT = fp(0.02) // 2%
const TEN_TX_GAS = fp(0.0084)
const QUOTA = TEN_TX_GAS.mul(10) //100 tx

//Config - Fee
const FEE_PCT = fp(0.02) // 2%

const deployment: EnvironmentDeployment = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
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
    //Depositor: for manual transfers and testing purposes
    {
      from: DEPLOYER,
      name: 'depositor',
      version: dependency('core/tasks/primitives/depositor/v2.1.1'),
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
      version: dependency('core/tasks/liquidity/balancer/bpt-exiter/v2.1.1'),
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
      version: dependency('core/tasks/swap/balancer-v2-boosted-swapper/v2.0.1'),
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
      version: dependency('core/tasks/swap/balancer-v2-linear-swapper/v2.0.1'),
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
      version: dependency('core/tasks/primitives/handle-over/v2.0.1'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('bpt-handle-over-connection'),
            nextBalanceConnectorId: balanceConnectorId('swapper-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 0, //Deny list
            tokens: [USDC],
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
                min: USDC_THRESHOLD,
                max: 0,
              },
            },
          },
        },
      },
    },
    //Handle over: moves USDC to be withdrawn
    {
      from: DEPLOYER,
      name: 'usdc-handle-over',
      version: dependency('core/tasks/primitives/handle-over/v2.0.1'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
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
            what: 'execute',
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
            who: dependency('usdc-handle-over'),
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
        where: dependency('paraswap-swapper-v2'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('usdc-handle-over'),
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
