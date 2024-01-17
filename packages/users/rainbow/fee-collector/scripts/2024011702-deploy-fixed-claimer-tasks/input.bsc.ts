import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TX_COST_LIMIT_PCT = fp(0.05) // 5%
const COLLECTOR = '0x20b9774e38c7ab425f49d926a74e798b0a295e55'
const SAFE = '0x9670271ec2e2937A2E9Df536784344bbfF2bbEa6'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    //Asset Collector: collect assets from external source
    {
      from: DEPLOYER,
      name: 'asset-collector-v2',
      version: 'RainbowClaimer',
      initialize: 'initializeRainbowClaimer',
      args: [COLLECTOR, SAFE],
      config: {
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
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023121100-environment-deploy', 'smart-vault'),
          revokes: [],
          grants: [
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
          ],
        },
        {
          where: dependency('asset-collector-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('2024010200-deploy-claimer-tasks', 'asset-collector'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
