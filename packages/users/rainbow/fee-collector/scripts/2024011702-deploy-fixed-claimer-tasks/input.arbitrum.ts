import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, NATIVE_TOKEN_ADDRESS } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TX_COST_LIMIT_PCT = fp(0.05) // 5%
const COLLECTOR = '0x264e109e8f24aae49320c28b5e7cbcf741f64274'
const SAFE = '0x0F9259af03052C96AFdA88ADD62eB3b5CbC185f1'

//Denied tokens
const USDC = '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8' //by Rainbow

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
          tokens: [NATIVE_TOKEN_ADDRESS, USDC],
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
