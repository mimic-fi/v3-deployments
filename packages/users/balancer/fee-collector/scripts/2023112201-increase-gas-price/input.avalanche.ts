import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const NEW_GAS_PRICE_LIMIT = 450e9

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'depositor'),
          grants: [{ who: DEPLOYER.address, what: 'setGasLimits', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setGasLimits', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-unwrapper'),
          grants: [{ who: DEPLOYER.address, what: 'setGasLimits', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-depositor'),
          grants: [{ who: DEPLOYER.address, what: 'setGasLimits', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'depositor'),
      method: 'setGasLimits',
      args: [NEW_GAS_PRICE_LIMIT, 0, 0, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
      method: 'setGasLimits',
      args: [NEW_GAS_PRICE_LIMIT, 0, 0, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'relayer-funder-unwrapper'),
      method: 'setGasLimits',
      args: [NEW_GAS_PRICE_LIMIT, 0, 0, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'relayer-depositor'),
      method: 'setGasLimits',
      args: [NEW_GAS_PRICE_LIMIT, 0, 0, 0],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'depositor'),
          revokes: [{ who: DEPLOYER.address, what: 'setGasLimits' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setGasLimits' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-unwrapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setGasLimits' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-depositor'),
          revokes: [{ who: DEPLOYER.address, what: 'setGasLimits' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
