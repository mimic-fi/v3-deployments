import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { HOUR, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TOKENS = [
  '0x184ff13b3ebcb25be44e860163a5d8391dd568c1', //kimbo
  '0x5ac04b69bde6f67c0bd5d6ba6fd5d816548b066a', // TECH
  '0x420fca0121dc28039145009570975747295f2329', // COQ
]
const LIMIT_TOKEN = tokens.avalanche.USDC
const LIMIT_AMOUNT = 5000e6
const LIMIT_PERIOD = 6 * HOUR

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011600-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', '1inch-swapper'),
      method: 'setCustomVolumeLimit',
      args: [TOKENS[0], LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011600-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
      method: 'setCustomVolumeLimit',
      args: [TOKENS[0], LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', '1inch-swapper'),
      method: 'setCustomVolumeLimit',
      args: [TOKENS[1], LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011600-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
      method: 'setCustomVolumeLimit',
      args: [TOKENS[1], LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', '1inch-swapper'),
      method: 'setCustomVolumeLimit',
      args: [TOKENS[2], LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011600-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
      method: 'setCustomVolumeLimit',
      args: [TOKENS[2], LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', '1inch-swapper'),
          grants: [],
          revokes: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit' }],
        },
        {
          where: dependency('2024011600-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
          grants: [],
          revokes: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit' }],
        },
      ],
    },
  ],
}

export default update
