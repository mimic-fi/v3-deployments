import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, NATIVE_TOKEN_ADDRESS } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TX_COST_LIMIT_PCT = fp(0.05) // 5%
const COLLECTOR = '0x2bCCB6dFB68e7EAA290dA3ac087482a9379782f7'
const ROUTER = '0x00000000009726632680FB29d3F7A9734E3010E2'

//Denied tokens
const USDC = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' //by Rainbow

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    //Asset Collector: collect assets from external source
    {
      from: DEPLOYER,
      name: 'asset-collector-v3',
      version: 'RainbowClaimer',
      initialize: 'initializeRainbowClaimer',
      args: [COLLECTOR, ROUTER],
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
              who: dependency('asset-collector-v3'),
              what: 'call',
              params: [],
            },
            {
              who: dependency('asset-collector-v3'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('asset-collector-v3'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('2024011702-deploy-fixed-claimer-tasks', 'asset-collector-v2'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update