import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp } from '@mimic-fi/v3-helpers'

const TOKENS = [
  '0x06c985ff69f7257e212a89828f79497a3c8b6edf',
  '0x43d4a3cd90ddd2f8f4f693170c9c8098163502ad',
  '0xb9098d3669a78e9afe8b94a97290407400d9da31',
]
const SLIPPAGES = [
  fp(0.13), //13%
  fp(0.05), //5%
  fp(0.05), //5%
]

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setCustomMaxSlippage', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011600-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setCustomMaxSlippage', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', '1inch-swapper'),
      method: 'setCustomMaxSlippage',
      args: [TOKENS[0], SLIPPAGES[0]],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011600-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
      method: 'setCustomMaxSlippage',
      args: [TOKENS[0], SLIPPAGES[0]],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', '1inch-swapper'),
      method: 'setCustomMaxSlippage',
      args: [TOKENS[1], SLIPPAGES[1]],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011600-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
      method: 'setCustomMaxSlippage',
      args: [TOKENS[1], SLIPPAGES[1]],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', '1inch-swapper'),
      method: 'setCustomMaxSlippage',
      args: [TOKENS[2], SLIPPAGES[2]],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011600-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
      method: 'setCustomMaxSlippage',
      args: [TOKENS[2], SLIPPAGES[2]],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setCustomMaxSlippage' }],
          grants: [],
        },
        {
          where: dependency('2024011600-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setCustomMaxSlippage' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
