import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp } from '@mimic-fi/v3-helpers'

const TX_COST_LIMIT_PCT = fp(0.08) // 8%

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023122000-deploy-tasks', 'depositor'),
          grants: [{ who: DEPLOYER.address, what: 'setGasLimits', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', 'wrapper'),
          grants: [{ who: DEPLOYER.address, what: 'setGasLimits', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setGasLimits', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'depositor'),
      method: 'setGasLimits',
      args: [0, 0, 0, TX_COST_LIMIT_PCT],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'wrapper'),
      method: 'setGasLimits',
      args: [0, 0, 0, TX_COST_LIMIT_PCT],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', '1inch-swapper'),
      method: 'setGasLimits',
      args: [0, 0, 0, TX_COST_LIMIT_PCT],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023122000-deploy-tasks', 'depositor'),
          revokes: [{ who: DEPLOYER.address, what: 'setGasLimits' }],
          grants: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', 'wrapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setGasLimits' }],
          grants: [],
        },
        {
          where: dependency('2023122000-deploy-tasks', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setGasLimits' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
