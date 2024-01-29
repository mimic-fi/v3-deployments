import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const BALANCE_CONNECTOR_ID = balanceConnectorId('swapper-connection')
const TOKENS = [
  '0x7e9250cC13559eB50536859e8C076Ef53e275Fb3',
  '0x004700ba0a4f5f22e1E78a277fCA55e36F47E09C',
  '0x5F8893506Ddc4C271837187d14A9C87964a074Dc',
]
const AMOUNTS = ['44780247455261329', '438913666851864931', '468043023600432866']
const ADD = false

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024011500-deploy-on-optimism', 'authorizer'),
      changes: [
        {
          where: dependency('2024011500-deploy-on-optimism', 'smart-vault'),
          grants: [{ who: DEPLOYER.address, what: 'updateBalanceConnector', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011500-deploy-on-optimism', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[0], AMOUNTS[0], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011500-deploy-on-optimism', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[1], AMOUNTS[1], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011500-deploy-on-optimism', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[2], AMOUNTS[2], ADD],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024011500-deploy-on-optimism', 'authorizer'),
      changes: [
        {
          where: dependency('2024011500-deploy-on-optimism', 'smart-vault'),
          revokes: [{ who: DEPLOYER.address, what: 'updateBalanceConnector' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
