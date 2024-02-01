import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { tokens } from '@mimic-fi/v3-helpers'

const USDC = tokens.mainnet.USDC
const PREV_BALANCE_CONNECTOR = balanceConnectorId('swapper-connection')
const OLD_NEXT_BALANCE_CONNECTOR = balanceConnectorId('bridger-connection')
const NEW_NEXT_BALANCE_CONNECTOR = balanceConnectorId('withdrawer-connection')
const AMOUNT = '11545108829'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setBalanceConnectors', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023121100-environment-deploy', 'smart-vault'),
          grants: [{ who: DEPLOYER.address, what: 'updateBalanceConnector', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
      method: 'setBalanceConnectors',
      args: [PREV_BALANCE_CONNECTOR, NEW_NEXT_BALANCE_CONNECTOR],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [OLD_NEXT_BALANCE_CONNECTOR, USDC, AMOUNT, false],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [NEW_NEXT_BALANCE_CONNECTOR, USDC, AMOUNT, true],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setBalanceConnectors' }],
          grants: [],
        },
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
