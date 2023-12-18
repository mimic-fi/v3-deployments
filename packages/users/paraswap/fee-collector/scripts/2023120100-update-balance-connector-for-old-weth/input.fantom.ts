import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { tokens } from '@mimic-fi/v3-helpers'

const OLD_BALANCE_CONNECTOR = balanceConnectorId('weth-to-usdc-swapper-connection')
const NEW_BALANCE_CONNECTOR = balanceConnectorId('swapper-connection')
const AMOUNT = '38650066799465216'

const OLD_WETH = tokens.fantom.WETH

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'smart-vault'),
          grants: [{ who: DEPLOYER.address, what: 'updateBalanceConnector', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111700-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [OLD_BALANCE_CONNECTOR, OLD_WETH, AMOUNT, false],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111700-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [NEW_BALANCE_CONNECTOR, OLD_WETH, AMOUNT, true],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'smart-vault'),
          revokes: [{ who: DEPLOYER.address, what: 'updateBalanceConnector' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
