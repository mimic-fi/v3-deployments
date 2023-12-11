import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const WRAPPED_NATIVE_TOKEN = tokens.fantom.WFTM

const QUOTA = fp(0.79).mul(10)
const MIN_WINDOW_GAS = QUOTA
const MAX_WINDOW_GAS = QUOTA.mul(10)

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023120300-replace-relayer-funder-swapper', 'relayer-funder-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] }],
          revokes: [],
        },
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
      method: 'setDefaultTokenOut',
      args: [WRAPPED_NATIVE_TOKEN],
    },
    {
      from: DEPLOYER,
      target: dependency('2023120300-replace-relayer-funder-swapper', 'relayer-funder-swapper-v2'),
      method: 'setDefaultTokenThreshold',
      args: [WRAPPED_NATIVE_TOKEN, MIN_WINDOW_GAS, MAX_WINDOW_GAS],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023120300-replace-relayer-funder-swapper', 'relayer-funder-swapper-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut' }],
          grants: [],
        },
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
