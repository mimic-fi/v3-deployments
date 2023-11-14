import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp } from '@mimic-fi/v3-helpers'

const TX_COST_LIMIT_PCT = fp(0.02) // 2%

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'asset-collector'),
          grants: [{ who: DEPLOYER.address, what: 'setGasLimits', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'bpt-exiter'),
          grants: [{ who: DEPLOYER.address, what: 'setGasLimits', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setGasLimits', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'asset-collector'),
      method: 'setGasLimits',
      args: [0, 0, 0, TX_COST_LIMIT_PCT],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'bpt-exiter'),
      method: 'setGasLimits',
      args: [0, 0, 0, TX_COST_LIMIT_PCT],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', '1inch-swapper'),
      method: 'setGasLimits',
      args: [0, 0, 0, TX_COST_LIMIT_PCT],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'asset-collector'),
          revokes: [{ who: DEPLOYER.address, what: 'setGasLimits' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'bpt-exiter'),
          revokes: [{ who: DEPLOYER.address, what: 'setGasLimits' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setGasLimits' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
