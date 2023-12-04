import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, tokens } from '@mimic-fi/v3-helpers'

const OLD_BALANCE_CONNECTOR = balanceConnectorId('withdrawer-connection')
const NEW_BALANCE_CONNECTOR = balanceConnectorId('swapper-connection')

const OLD_USDC = tokens.fantom.USDC

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', 'smart-vault'),
          grants: [{ who: DEPLOYER.address, what: 'updateBalanceConnector', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [OLD_BALANCE_CONNECTOR, OLD_USDC, bn(8714913888), false],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [NEW_BALANCE_CONNECTOR, OLD_USDC, bn(8714913888), true],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', 'smart-vault'),
          revokes: [{ who: DEPLOYER.address, what: 'updateBalanceConnector' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
