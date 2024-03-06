import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

/* eslint-disable no-secrets/no-secrets */

const USDCe = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' //USDCe
const BALANCE_CONNECTOR_ID = balanceConnectorId('withdrawer-connection')
const AMOUNT = '164349051800'

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
