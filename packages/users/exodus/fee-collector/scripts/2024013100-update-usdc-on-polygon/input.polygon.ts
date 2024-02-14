import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, fp } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

const USDC = '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' //USDC
const USDCe = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' //USDCe

const USDC_CONVERT_THRESHOLD = bn(20e6) // 20 USDC

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'exodus-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121800-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023121800-environment-deploy', 'wrapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023121800-environment-deploy', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023121800-environment-deploy', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023121800-environment-deploy', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023121800-environment-deploy', 'usdc-handle-over'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024012900-add-wormhole-to-polygon', 'wormhole-bridger'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultMaxFee', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024012900-add-wormhole-to-polygon', 'wormhole-bridger'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024012900-add-wormhole-to-polygon', 'wormhole-bridger'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023121800-environment-deploy', 'relayer-funder-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121800-environment-deploy', 'wrapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_CONVERT_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121800-environment-deploy', '1inch-swapper'),
      method: 'setDefaultTokenOut',
      args: [USDC],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121800-environment-deploy', '1inch-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121800-environment-deploy', '1inch-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_CONVERT_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121800-environment-deploy', 'usdc-handle-over'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024012900-add-wormhole-to-polygon', 'wormhole-bridger'),
      method: 'setDefaultMaxFee',
      args: [USDC, fp(0.02)],
    },
    {
      from: DEPLOYER,
      target: dependency('2024012900-add-wormhole-to-polygon', 'wormhole-bridger'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024012900-add-wormhole-to-polygon', 'wormhole-bridger'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_CONVERT_THRESHOLD.mul(2), 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121800-environment-deploy', 'relayer-funder-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [true, false],
      ],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121800-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023121800-environment-deploy', 'wrapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2023121800-environment-deploy', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut' }],
          grants: [],
        },
        {
          where: dependency('2023121800-environment-deploy', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2023121800-environment-deploy', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2023121800-environment-deploy', 'usdc-handle-over'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2024012900-add-wormhole-to-polygon', 'wormhole-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultMaxFee' }],
          grants: [],
        },
        {
          where: dependency('2024012900-add-wormhole-to-polygon', 'wormhole-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2024012900-add-wormhole-to-polygon', 'wormhole-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2023121800-environment-deploy', 'relayer-funder-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
