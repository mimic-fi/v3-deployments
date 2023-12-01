import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, tokens } from '@mimic-fi/v3-helpers'

const USDC_Remove = tokens.fantom.USDC
const USDC_Add = '0x28a92dde19d9989f39a49905d7c9c2fac7799bdf' //USDC token by Beethoven

const USDC_THRESHOLD = bn(100000000) // 100 USDC

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
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
          grants: [
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] },
          ],
          revokes: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'bpt-handle-over'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          grants: [
            { who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] },
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] },
          ],
          revokes: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
          grants: [
            { who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] },
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] },
          ],
          revokes: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'usdc-handle-over'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'withdrawer'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'relayer-funder-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'asset-collector'),
      method: 'setDefaultTokenThreshold',
      args: [USDC_Add, USDC_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'bpt-exiter'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC_Add, USDC_Remove],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'bpt-exiter'),
      method: 'setDefaultTokenThreshold',
      args: [USDC_Add, USDC_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'bpt-handle-over'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC_Add, USDC_Remove],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', '1inch-swapper'),
      method: 'setDefaultTokenOut',
      args: [USDC_Add],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', '1inch-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC_Add, USDC_Remove],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', '1inch-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC_Add, USDC_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
      method: 'setDefaultTokenOut',
      args: [USDC_Add],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC_Add, USDC_Remove],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC_Add, USDC_THRESHOLD, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'usdc-handle-over'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC_Add, USDC_Remove],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'withdrawer'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC_Add, USDC_Remove],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'relayer-funder-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC_Add, USDC_Remove],
        [true, false],
      ],
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
          revokes: [
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList' },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold' },
          ],
          grants: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'bpt-handle-over'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          revokes: [
            { who: DEPLOYER.address, what: 'setDefaultTokenOut' },
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList' },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold' },
          ],
          grants: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'paraswap-swapper'),
          revokes: [
            { who: DEPLOYER.address, what: 'setDefaultTokenOut' },
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList' },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold' },
          ],
          grants: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'usdc-handle-over'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'withdrawer'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2023111100-environment-deploy', 'relayer-funder-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
