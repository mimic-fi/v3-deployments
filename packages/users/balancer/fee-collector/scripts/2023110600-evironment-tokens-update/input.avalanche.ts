import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, tokens } from '@mimic-fi/v3-helpers'

const USDC_Remove = tokens.avalanche.WETH
const USDC_Add = tokens.avalanche.WAVAX

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collectoh',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
          grants: [
            { who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] },
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] },
          ],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-unwrapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
      method: 'setDefaultTokenOut',
      args: [USDC_Add],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC_Add, USDC_Remove],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC_Add, fp(0.005), fp(0.01)],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'relayer-funder-unwrapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC_Add, USDC_Remove],
        [true, false],
      ],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
          revokes: [
            { who: DEPLOYER.address, what: 'setDefaultTokenOut' },
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList' },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold' },
          ],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-unwrapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
