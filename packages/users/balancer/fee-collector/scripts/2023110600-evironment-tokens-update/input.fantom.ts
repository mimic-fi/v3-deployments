import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, tokens } from '@mimic-fi/v3-helpers'

const USDC_Remove = tokens.avalanche.USDC
const USDC_Add = tokens.fantom.USDC

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collectoh',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'bpt-exiter'),
          grants: [
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] },
          ],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'bpt-handle-over'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', '1inch-swapper'),
          grants: [
            { who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] },
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] },
          ],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'usdc-handle-over'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'bpt-exiter'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC_Add, USDC_Remove],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'bpt-exiter'),
      method: 'setDefaultTokenThreshold',
      args: [USDC_Add, fp(10), 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'bpt-handle-over'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC_Add, USDC_Remove],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', '1inch-swapper'),
      method: 'setDefaultTokenOut',
      args: [USDC_Add],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', '1inch-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC_Add, USDC_Remove],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', '1inch-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC_Add, fp(10), 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'usdc-handle-over'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC_Add, USDC_Remove],
        [true, false],
      ],
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
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'bpt-exiter'),
          revokes: [
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList' },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold' },
          ],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'bpt-handle-over'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', '1inch-swapper'),
          revokes: [
            { who: DEPLOYER.address, what: 'setDefaultTokenOut' },
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList' },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold' },
          ],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'usdc-handle-over'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
