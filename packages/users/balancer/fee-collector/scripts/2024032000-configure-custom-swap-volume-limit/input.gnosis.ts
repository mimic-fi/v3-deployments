import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { MINUTE, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TOKEN = '0x6c76971f98945ae98dd7d4dfca8711ebea946ea6' // wstETH
const LIMIT_TOKEN = tokens.gnosis.USDC
const LIMIT_AMOUNT = 1000e6
const LIMIT_PERIOD = 30 * MINUTE

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024011602-deploy-other-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024011602-deploy-other-environments', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011602-deploy-other-environments', '1inch-swapper'),
      method: 'setCustomVolumeLimit',
      args: [TOKEN, LIMIT_TOKEN, LIMIT_AMOUNT, LIMIT_PERIOD],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024011602-deploy-other-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024011602-deploy-other-environments', '1inch-swapper'),
          grants: [],
          revokes: [{ who: DEPLOYER.address, what: 'setCustomVolumeLimit' }],
        },
      ],
    },
  ],
}

export default update
