import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn } from '@mimic-fi/v3-helpers'

const USDC = '0x28a92dde19d9989f39a49905d7c9c2fac7799bdf' //USDC token by Beethoven
const USDC_THRESHOLD = bn(10000000) // 10 USDC

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', 'asset-collector'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'bpt-exiter'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'asset-collector'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'bpt-exiter'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', '1inch-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, USDC_THRESHOLD, 0],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', 'asset-collector'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'bpt-exiter'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
