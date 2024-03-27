import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, HOUR, tokens } from '@mimic-fi/v3-helpers'

const BALANCE_CONNECTOR_ID = balanceConnectorId('swapper-connection')
const TOKEN = '0x74ccbe53f77b08632ce0cb91d3a545bf6b8e0979'
const AMOUNT = '270399006336404782912141'
const ADD = true

const LIMIT_TOKEN = '0x28a92dde19d9989f39a49905d7c9c2fac7799bdf'
const LIMIT_AMOUNT = 500e6
const LIMIT_PERIOD = HOUR

const SLIPPAGE = fp(0.15) // 15%

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
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
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122701-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setCustomMaxSlippage', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122701-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setCustomMaxSlippage', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'smart-vault'),
      method: 'updateBalanceConnector',
      args: [BALANCE_CONNECTOR_ID, TOKEN, AMOUNT, ADD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', '1inch-swapper'),
      method: 'setCustomVolumeLimit',
      args: [TOKEN, LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122701-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
      method: 'setCustomVolumeLimit',
      args: [TOKEN, LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', '1inch-swapper'),
      method: 'setCustomMaxSlippage',
      args: [TOKEN, SLIPPAGE],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122701-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
      method: 'setCustomMaxSlippage',
      args: [TOKEN, SLIPPAGE],
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
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          grants: [],
          revokes: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit' }],
        },
        {
          where: dependency('2023122701-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
          grants: [],
          revokes: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit' }],
        },
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          grants: [],
          revokes: [{ who: DEPLOYER.address, what: 'setCustomMaxSlippage' }],
        },
        {
          where: dependency('2023122701-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
          grants: [],
          revokes: [{ who: DEPLOYER.address, what: 'setCustomMaxSlippage' }],
        },
      ],
    },
  ],
}

export default update
