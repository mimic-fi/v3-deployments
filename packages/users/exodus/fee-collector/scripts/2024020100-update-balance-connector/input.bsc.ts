import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

/* eslint-disable no-secrets/no-secrets */

const USDC = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
const BALANCE_CONNECTOR_ID = balanceConnectorId('bridger-connection')
const AMOUNT = '4985583997606208665547'

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
      args: [BALANCE_CONNECTOR_ID, USDC, AMOUNT, false],
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
