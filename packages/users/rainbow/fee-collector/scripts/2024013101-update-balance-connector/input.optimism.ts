import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const USDCe = '0x7F5c764cBc14f9669B88837ca1490cCa17c31607' //USDCe
const OLD_BALANCE_CONNECTOR = balanceConnectorId('bridger-connection')
const NEW_BALANCE_CONNECTOR = balanceConnectorId('swapper-connection')
const AMOUNT = '13560757314'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023121100-environment-deploy', 'smart-vault'),
          grants: [{ who: DEPLOYER.address, what: 'updateBalanceConnector', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [OLD_BALANCE_CONNECTOR, USDCe, AMOUNT, false],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [NEW_BALANCE_CONNECTOR, USDCe, AMOUNT, true],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023121100-environment-deploy', 'smart-vault'),
          revokes: [{ who: DEPLOYER.address, what: 'updateBalanceConnector' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
