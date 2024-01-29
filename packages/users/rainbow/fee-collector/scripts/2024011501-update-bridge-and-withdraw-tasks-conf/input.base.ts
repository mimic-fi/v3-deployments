import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, tokens } from '@mimic-fi/v3-helpers'

const USDC = tokens.base.USDC
const THRESHOLD = bn(10000e6) // 10k USDC

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
          grants: [{ who: DEPLOYER.address, what: 'setTimeLock', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
      method: 'setTimeLock',
      args: [0, 0, 0, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, THRESHOLD, 0],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setTimeLock' }],
          grants: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
