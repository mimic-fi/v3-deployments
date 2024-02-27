import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

const USDC = '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' //USDC
const USDCe = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' //USDCe

const USDC_CONVERT_THRESHOLD = bn(100e6) // 100 USDC

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024011602-deploy-other-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024011602-deploy-other-environments', 'bpt-handle-over'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'migration-claimer'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'asset-collector-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'bpt-exiter-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'balancer-v2-boosted-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'balancer-v2-linear-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'usdc-handle-over'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'relayer-funder-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', 'bpt-handle-over'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', 'migration-claimer'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_CONVERT_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', 'asset-collector-v2'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_CONVERT_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', 'bpt-exiter-v2'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_CONVERT_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', 'balancer-v2-boosted-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_CONVERT_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', 'balancer-v2-linear-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_CONVERT_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', '1inch-swapper'),
      method: 'setDefaultTokenOut',
      args: [USDC],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', '1inch-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', '1inch-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_CONVERT_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', 'paraswap-swapper-v2'),
      method: 'setDefaultTokenOut',
      args: [USDC],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', 'paraswap-swapper-v2'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', 'paraswap-swapper-v2'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_CONVERT_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', 'usdc-handle-over'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', 'relayer-funder-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024011602-deploy-other-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024011602-deploy-other-environments', 'bpt-handle-over'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'migration-claimer'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'asset-collector-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'bpt-exiter-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'balancer-v2-boosted-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'balancer-v2-linear-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut' }],
          grants: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'paraswap-swapper-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut' }],
          grants: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'paraswap-swapper-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'paraswap-swapper-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'usdc-handle-over'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2024011602-deploy-other-environments', 'relayer-funder-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
