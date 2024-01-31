import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, fp } from '@mimic-fi/v3-helpers'

const USDC = '0x0b2c639c533813f4aa9d7837caf62653d097ff85' //USDC
const USDCe = '0x7F5c764cBc14f9669B88837ca1490cCa17c31607' //USDCe

const USDC_CONVERT_THRESHOLD = bn(20e6) // 20 USDC
const USDC_BRIDGER_THRESHOLD = bn(10000e6) // 10k USDC

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023122000-deploy-tasks', 'wrapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', 'usdc-handle-over'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultMaxFee', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', 'relayer-funder-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'wrapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_CONVERT_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', '1inch-swapper'),
      method: 'setDefaultTokenOut',
      args: [USDC],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', '1inch-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', '1inch-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_CONVERT_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
      method: 'setDefaultTokenOut',
      args: [USDC],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_CONVERT_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'usdc-handle-over'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
      method: 'setDefaultMaxFee',
      args: [USDC, fp(0.02)],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_BRIDGER_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'relayer-funder-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023122000-deploy-tasks', 'wrapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut' }],
          grants: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut' }],
          grants: [],
        },
        {
          where: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },

        {
          where: dependency('2023122000-deploy-tasks', 'usdc-handle-over'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultMaxFee' }],
          grants: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', 'relayer-funder-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
