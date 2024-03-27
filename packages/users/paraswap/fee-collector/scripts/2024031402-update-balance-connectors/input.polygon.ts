import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const WRAPPED_NATIVE_TOKEN = tokens.polygon.WMATIC

const OLD_BALANCE_CONNECTOR = balanceConnectorId('weth-to-usdc-swapper-connection')
const NEW_BALANCE_CONNECTOR = balanceConnectorId('swapper-connection')
const AMOUNT = '189247832874399197028'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024022002-deploy-new-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024022002-deploy-new-environments', 'smart-vault'),
          grants: [{ who: DEPLOYER.address, what: 'updateBalanceConnector', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024022002-deploy-new-environments', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [OLD_BALANCE_CONNECTOR, WRAPPED_NATIVE_TOKEN, AMOUNT, false],
    },
    {
      from: DEPLOYER,
      target: dependency('2024022002-deploy-new-environments', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [NEW_BALANCE_CONNECTOR, WRAPPED_NATIVE_TOKEN, AMOUNT, true],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024022002-deploy-new-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024022002-deploy-new-environments', 'smart-vault'),
          revokes: [{ who: DEPLOYER.address, what: 'updateBalanceConnector' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
