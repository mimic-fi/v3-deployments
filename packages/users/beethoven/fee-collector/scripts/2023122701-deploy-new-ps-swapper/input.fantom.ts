import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, fp } from '@mimic-fi/v3-helpers'

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
    //Paraswap Swapper: swap assets using Paraswap dex aggregator
    {
      from: DEPLOYER,
      name: 'paraswap-swapper-v2',
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
              smartVault: dependency('2023111100-environment-deploy', 'smart-vault'),
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
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', 'smart-vault'),
          revokes: [],
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
          ],
        },
        {
          where: dependency('paraswap-swapper-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
