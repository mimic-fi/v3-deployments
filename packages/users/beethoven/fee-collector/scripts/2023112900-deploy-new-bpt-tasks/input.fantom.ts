import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, fp, ZERO_ADDRESS } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const USDC = '0x28a92dde19d9989f39a49905d7c9c2fac7799bdf' //USDC token by Beethoven

//Config - Threshold
const USDC_THRESHOLD = bn(10000000) // 10 USDC

//Config - Gas
const TX_COST_LIMIT_PCT = fp(0.02) // 2%

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
  steps: [
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
            smartVault: dependency('2023111100-environment-deploy', 'smart-vault'),
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
              smartVault: dependency('2023111100-environment-deploy', 'smart-vault'),
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
              smartVault: dependency('2023111100-environment-deploy', 'smart-vault'),
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
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', 'smart-vault'),
          revokes: [],
          grants: [
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
          ],
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
      ],
    },
  ],
}

export default update
