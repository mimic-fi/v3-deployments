import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

//Config - Tokens
const WETH = '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    {
      from: DEPLOYER,
      name: 'weth-handle-over',
      version: dependency('core/tasks/primitives/handle-over/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2024022002-deploy-new-environments', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
            nextBalanceConnectorId: balanceConnectorId('weth-to-usdc-swapper-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [WETH],
          },
        },
      },
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024022002-deploy-new-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024022002-deploy-new-environments', 'smart-vault'),
          revokes: [],
          grants: [
            {
              who: dependency('weth-handle-over'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('weth-handle-over'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
