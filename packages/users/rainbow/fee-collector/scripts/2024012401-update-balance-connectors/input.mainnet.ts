import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const BALANCE_CONNECTOR_ID = balanceConnectorId('swapper-connection')
const TOKENS = [
  '0x72e4f9f808c49a2a61de9c5896298920dc4eeea9',
  '0xb23d80f5fefcddaa212212f028021b41ded428cf',
  '0xdac17f958d2ee523a2206206994597c13d831ec7',
  '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  '0x046eee2cc3188071c02bfc1745a6b17c656e3f3d',
]
const AMOUNTS = [
  '171247807052',
  '19233402046255583235',
  '2209197713',
  '1213941965215000000001',
  '226766577685146328',
  '1304001003959543590441',
]
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
      args: [BALANCE_CONNECTOR_ID, TOKENS[0], AMOUNTS[0], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[1], AMOUNTS[1], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[2], AMOUNTS[2], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[3], AMOUNTS[3], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[4], AMOUNTS[4], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[5], AMOUNTS[5], ADD],
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
