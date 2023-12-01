import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const PREV_BALANCE_CONNECTOR = balanceConnectorId('weth-to-usdc-swapper-connection')
const NEXT_BALANCE_CONNECTOR = balanceConnectorId('relayer-funder-unwrapper')

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'relayer-funder-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setBalanceConnectors', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111700-environment-deploy', 'relayer-funder-swapper'),
      method: 'setBalanceConnectors',
      args: [PREV_BALANCE_CONNECTOR, NEXT_BALANCE_CONNECTOR],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'relayer-funder-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setBalanceConnectors' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
