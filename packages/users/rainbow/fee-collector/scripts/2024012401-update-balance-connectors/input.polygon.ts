import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const BALANCE_CONNECTOR_ID = balanceConnectorId('swapper-connection')
const TOKENS = [
  '0x430ef9263e76dae63c84292c3409d61c598e9682',
  '0xb87904db461005fc716a6bf9f2d451c33b10b80b',
  '0xeee3371b89fc43ea970e908536fcddd975135d8a',
  '0xa3fa99a148fa48d14ed51d610c367c61876997f1',
  '0x94025780a1ab58868d9b2dbbb775f44b32e8e6e5',
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  '0xee9a352f6aac4af1a5b9f467f6a93e0ffbe9dd35',
  '0xe238ecb42c424e877652ad82d8a939183a04c35f',
  '0xd0258a3fd00f38aa8090dfee343f10a9d4d30d3f',
  '0x235737dbb56e8517391473f7c964db31fa6ef280',
  '0x2760e46d9bb43dafcbecaad1f64b93207f9f0ed7',
  '0xefcfece12a99d1dbbf6f3264ee97f8c045e97f1f',
  '0xc6480da81151b2277761024599e8db2ad4c388c8',
  '0xdab529f40e671a1d4bf91361c21bf9f0c9712ab7',
  '0xd0513db39d87e8825389feb10bd911dc53b3a153',
  '0xba777ae3a3c91fcd83ef85bfe65410592bdd0f7c',
  '0x34667ed7c36cbbbf2d5d5c5c8d6eb76a094edb9f',
  '0xe261d618a959afffd53168cd07d12e37b26761db',
]
const AMOUNTS = [
  '976150815977151086',
  '15301563493453544',
  '24892420000000000001',
  '78514010349301445',
  '375412330878193300290',
  '132530176839869930880',
  '850000000000000001',
  '45050000000000000001',
  '507669408539561616120',
  '1700000000000000001',
  '424888099237814663',
  '335617187500000000000',
  '26933754500000000001',
  '740718501447649964',
  '76500000000000000001',
  '2441508685246417389500000',
  '463675000000000000000',
  '2098016480295101528800',
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
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[11], AMOUNTS[11], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[12], AMOUNTS[12], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[13], AMOUNTS[13], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[14], AMOUNTS[14], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[15], AMOUNTS[15], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[16], AMOUNTS[16], ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKENS[17], AMOUNTS[17], ADD],
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
