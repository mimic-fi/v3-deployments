0xaf36e4921829e7ca6376d6f2bd2771c23909f2f27686bd55f43bdb5bef0d93d7

import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const BALANCE_CONNECTOR_ID_SWAPPER = balanceConnectorId('swapper-connection')
const BALANCE_CONNECTOR_ID_BRIDGER = balanceConnectorId('bridger-connection')

const TOKENS = ['0x47c454ca6be2f6def6f32b638c80f91c9c3c5949', '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d']
const AMOUNTS = ['210370143372529632258', '13958627558765909149', '266515181112827181813']
const ADD = false

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
      args: [BALANCE_CONNECTOR_ID_SWAPPER, TOKENS[0], AMOUNTS[0], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID_SWAPPER, TOKENS[1], AMOUNTS[1], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID_BRIDGER, TOKENS[1], AMOUNTS[2], ADD],
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
