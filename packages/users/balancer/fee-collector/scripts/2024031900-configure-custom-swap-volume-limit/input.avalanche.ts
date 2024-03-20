import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { DAY, fp, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

const TOKEN = '0x594fe86e60d8df04ec9c5b2f7fec09dc14175804'
const LIMIT_TOKEN = tokens.avalanche.USDC
const LIMIT_AMOUNT = '5000e6'
const LIMIT_PERIOD = DAY

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
