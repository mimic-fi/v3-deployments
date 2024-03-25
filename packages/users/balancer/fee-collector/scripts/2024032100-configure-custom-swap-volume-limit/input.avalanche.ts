import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { HOUR, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TOKENS = [
  '0xAcFb898Cff266E53278cC0124fC2C7C94C8cB9a5', //NOCHILL
  '0xE8385CECb013561b69bEb63FF59f4d10734881f3', // GEC
  '0x0df1Be54B29aA9828Bea1De6A6DFE3d03EC63082', // BPT AF Culture Coins
]
const LIMIT_TOKEN = tokens.avalanche.USDC
const LIMIT_AMOUNT = 2000e6
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
          where: dependency('2023101700-environment-deploy', 'bpt-exiter-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'balancer-v2-boosted-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'balancer-v2-linear-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit', params: [] }],
          revokes: [],
        },
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
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'bpt-exiter-v2'),
      method: 'setCustomVolumeLimit',
      args: [TOKENS[2], LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'balancer-v2-boosted-swapper'),
      method: 'setCustomVolumeLimit',
      args: [TOKENS[2], LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'balancer-v2-linear-swapper'),
      method: 'setCustomVolumeLimit',
      args: [TOKENS[2], LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'bpt-exiter-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'balancer-v2-boosted-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'balancer-v2-linear-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit' }],
          grants: [],
        },
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
