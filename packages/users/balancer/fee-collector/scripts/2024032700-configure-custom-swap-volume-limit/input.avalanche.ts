import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { HOUR, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TOKEN = '0xaa4eee23426bff1af8d79d6179e5a5c311f6adcc' // Culture Vol Farms
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
      target: dependency('2023101700-environment-deploy', 'bpt-exiter-v2'),
      method: 'setCustomVolumeLimit',
      args: [TOKEN, LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'balancer-v2-boosted-swapper'),
      method: 'setCustomVolumeLimit',
      args: [TOKEN, LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'balancer-v2-linear-swapper'),
      method: 'setCustomVolumeLimit',
      args: [TOKEN, LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', '1inch-swapper'),
      method: 'setCustomVolumeLimit',
      args: [TOKEN, LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011600-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
      method: 'setCustomVolumeLimit',
      args: [TOKEN, LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
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
