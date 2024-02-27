import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const BALANCE_CONNECTOR_ID = balanceConnectorId('swapper-connection')
const TOKENS = [
  '0x1db2466d9f5e10d7090e7152b68d62703a2245f0',
  '0x296f55f8fb28e498b858d0bcda06d955b2cb3f97',
  '0x9560e827af36c94d2ac33a39bce1fe78631088db',
  '0x4200000000000000000000000000000000000042',
  '0x1f32b1c2345538c0c6f582fcb022739c4a194ebb',
  '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
  '0xc40f949f8a4e094d1b49a23ea9241d289b7b2819',
  '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
  '0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1',
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
  '0x9bcef72be871e61ed4fbbc7630889bee758eb81d',
]
const AMOUNTS = [
  '253429255514742000000',
  '57758912636433200000',
  '514796152219999000000',
  '387803451133100000000',
  '25541857694704800',
  '1103231868',
  '52495945944408300000',
  '1061052355',
  '22124242867569000000',
  '398505933853167000000',
  '56312097628604300',
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
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[6], AMOUNTS[6], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[7], AMOUNTS[7], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[8], AMOUNTS[8], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[9], AMOUNTS[9], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[10], AMOUNTS[10], ADD],
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
