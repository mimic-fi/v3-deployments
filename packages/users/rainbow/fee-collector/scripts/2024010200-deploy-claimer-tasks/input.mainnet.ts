import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp } from '@mimic-fi/v3-helpers'

/*
FEE_COLLECTOR_MAINNET=
FEE_COLLECTOR_ARBITRUM=0x264e109e8f24aae49320c28b5e7cbcf741f64274
FEE_COLLECTOR_OPTIMISM=0x264e109e8f24aae49320c28b5e7cbcf741f64274
FEE_COLLECTOR_POLYGON=0x264e109e8f24aae49320c28b5e7cbcf741f64274
FEE_COLLECTOR_BSC=0x20b9774e38c7ab425f49d926a74e798b0a295e55
FEE_COLLECTOR_BASE=0x2bCCB6dFB68e7EAA290dA3ac087482a9379782f7
*/

const TX_COST_LIMIT_PCT = fp(0.08) // 8%

const COLLECTOR = '0x965e2eff8cbd2f49702cfc863dca8acbd91c9ed9'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    //Asset Collector: collect assets from external source
    {
      from: DEPLOYER,
      name: 'asset-collector',
      version: 'RainbowClaimer',
      initialize: 'initializeRainbowClaimer',
      args: [COLLECTOR],
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
              who: dependency('asset-collector'),
              what: 'call',
              params: [],
            },
            {
              who: dependency('asset-collector'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('asset-collector'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
