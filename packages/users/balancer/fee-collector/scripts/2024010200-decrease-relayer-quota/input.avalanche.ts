import { dependency, DEPLOYER, EnvironmentUpdate, PROTOCOL_ADMIN, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, tokens } from '@mimic-fi/v3-helpers'

const WRAPPED_NATIVE_TOKEN = tokens.avalanche.WAVAX
const QUOTA = fp(1)
const MIN_WINDOW_GAS = QUOTA
const MAX_WINDOW_GAS = QUOTA.mul(10)

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: PROTOCOL_ADMIN,
      target: dependency('core/relayer/v1.1.0'),
      method: 'setSmartVaultMaxQuota',
      args: [dependency('2023101700-environment-deploy', 'smart-vault'), QUOTA],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023120300-replace-relayer-funder-swapper', 'relayer-funder-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023120300-replace-relayer-funder-swapper', 'relayer-funder-swapper-v2'),
      method: 'setDefaultTokenThreshold',
      args: [WRAPPED_NATIVE_TOKEN, MIN_WINDOW_GAS, MAX_WINDOW_GAS],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023120300-replace-relayer-funder-swapper', 'relayer-funder-swapper-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
