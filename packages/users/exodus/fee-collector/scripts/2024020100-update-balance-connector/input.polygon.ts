import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

/* eslint-disable no-secrets/no-secrets */

const USDCe = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' //USDCe
const BALANCE_CONNECTOR_ID = balanceConnectorId('swapper-connection')
const AMOUNT = '5791120515'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'exodus-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121800-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023121800-environment-deploy', 'smart-vault'),
          grants: [{ who: DEPLOYER.address, what: 'updateBalanceConnector', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121800-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, USDCe, AMOUNT, false],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121800-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023121800-environment-deploy', 'smart-vault'),
          revokes: [{ who: DEPLOYER.address, what: 'updateBalanceConnector' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
