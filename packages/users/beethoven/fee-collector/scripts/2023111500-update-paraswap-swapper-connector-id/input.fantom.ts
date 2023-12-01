import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const PREV_BALANCE_CONNECTOR = balanceConnectorId('swapper-connection')
const NEXT_BALANCE_CONNECTOR = balanceConnectorId('withdrawer-connection')

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setBalanceConnectors', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
      method: 'setBalanceConnectors',
      args: [PREV_BALANCE_CONNECTOR, NEXT_BALANCE_CONNECTOR],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setBalanceConnectors' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
