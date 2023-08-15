import { OP } from '@mimic-fi/v3-authorizer'
import {
  balanceConnectorId,
  dependency,
  DEPLOYER,
  EnvironmentDeployment,
  MIMIC_V2_BOT,
  PROTOCOL_ADMIN,
  USERS_ADMIN,
} from '@mimic-fi/v3-deployments-lib'
import { chainlink, fp, NATIVE_TOKEN_ADDRESS, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

const GRT = '0x23a941036ae778ac51ab04cea08ed6e2fe103614'
const THE_GRAPH_OWNER = '0x270Ea4ea9e8A699f8fE54515E3Bb2c418952623b'
const THE_GRAPH_FUNDER = '0x43734F373Eb68bDabe0b89172d7da828219EF861'
const THE_GRAPH_ALLOCATION_EXCHANGE = '0x993F00C98D1678371a7b261Ed0E0D4b6F42d9aEE'

const deployment: EnvironmentDeployment = {
  deployer: dependency('core/deployer/v1.0.0-beta'),
  namespace: 'the-graph',
  authorizer: {
    from: DEPLOYER,
    name: 'authorizer',
    version: dependency('core/authorizer/v1.0.0-beta'),
    owners: [THE_GRAPH_OWNER, USERS_ADMIN.safe],
  },
  priceOracle: {
    from: DEPLOYER,
    name: 'price-oracle',
    version: dependency('core/price-oracle/v1.0.0-beta'),
    authorizer: dependency('authorizer'),
    signer: MIMIC_V2_BOT.address,
    pivot: chainlink.denominations.USD,
    feeds: [],
  },
  smartVault: {
    from: DEPLOYER,
    name: 'smart-vault',
    version: dependency('core/smart-vault/v1.0.0-beta'),
    authorizer: dependency('authorizer'),
    priceOracle: dependency('price-oracle'),
  },
  tasks: [
    {
      from: DEPLOYER,
      name: 'collector-exchange-allocator',
      version: 'ExchangeAllocator',
      initialize: 'initializeExchangeAllocator',
      args: [THE_GRAPH_ALLOCATION_EXCHANGE],
      config: {
        tokensSource: THE_GRAPH_FUNDER,
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('exchange-allocator-withdrawer'),
          },
          gasLimitConfig: {
            gasPriceLimit: 10e9,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [GRT],
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: GRT,
              min: fp(10),
              max: fp(100),
            },
          },
        },
      },
    },
    {
      from: DEPLOYER,
      name: 'exchange-allocator-withdrawer',
      version: dependency('core/tasks/primitives/withdrawer/v1.0.0-beta'),
      config: {
        recipient: THE_GRAPH_ALLOCATION_EXCHANGE,
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('exchange-allocator-withdrawer'),
          },
          gasLimitConfig: {
            gasPriceLimit: 10e9,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [GRT],
          },
        },
      },
    },
    {
      from: DEPLOYER,
      name: 'collector-relayer-funder',
      version: dependency('core/tasks/relayer/collector/v1.0.0-beta'),
      initialize: 'initializeCollectorRelayerFunder',
      args: [dependency('core/relayer/v1.0.0-beta')],
      config: {
        tokensSource: THE_GRAPH_FUNDER,
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('relayer-funder-swapper'),
          },
          gasLimitConfig: {
            gasPriceLimit: 10e9,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [GRT],
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: tokens.arbitrum.WETH,
              min: fp(0.005),
              max: fp(0.01),
            },
          },
        },
      },
    },
    {
      from: DEPLOYER,
      name: 'relayer-funder-swapper',
      version: dependency('core/tasks/swap/1inch-v5/v1.0.0-beta'),
      config: {
        baseSwapConfig: {
          connector: dependency('core/connectors/1inch-v5/v1.0.0-beta'),
          tokenOut: tokens.arbitrum.WETH,
          maxSlippage: fp(0.002),
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('relayer-funder-swapper'),
              nextBalanceConnectorId: balanceConnectorId('relayer-funder-unwrapper'),
            },
            gasLimitConfig: {
              gasPriceLimit: 10e9,
            },
            tokenIndexConfig: {
              acceptanceType: 1,
              tokens: [GRT],
            },
          },
        },
      },
    },
    {
      from: DEPLOYER,
      name: 'relayer-funder-unwrapper',
      version: dependency('core/tasks/primitives/unwrapper/v1.0.0-beta'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('relayer-funder-unwrapper'),
            nextBalanceConnectorId: balanceConnectorId('relayer-depositor'),
          },
          gasLimitConfig: {
            gasPriceLimit: 10e9,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [tokens.arbitrum.WETH],
          },
        },
      },
    },
    {
      from: DEPLOYER,
      name: 'relayer-depositor',
      version: dependency('core/tasks/relayer/depositor/v1.1.0-beta'),
      args: [dependency('core/relayer/v1.0.0-beta')],
      config: {
        baseConfig: {
          smartVault: dependency('smart-vault'),
          previousBalanceConnectorId: balanceConnectorId('relayer-funder-unwrapper'),
        },
        gasLimitConfig: {
          gasPriceLimit: 10e9,
        },
        tokenIndexConfig: {
          acceptanceType: 1,
          tokens: [NATIVE_TOKEN_ADDRESS],
        },
      },
    },
  ],
  permissions: {
    from: USERS_ADMIN,
    authorizer: dependency('authorizer'),
    changes: [
      {
        where: dependency('smart-vault'),
        revokes: [],
        grants: [{ who: dependency('collector-exchange-allocator'), what: 'collect', params: [] }],
      },
      {
        where: dependency('smart-vault'),
        revokes: [],
        grants: [{ who: dependency('exchange-allocator-withdrawer'), what: 'withdraw', params: [] }],
      },
      {
        where: dependency('smart-vault'),
        revokes: [],
        grants: [{ who: dependency('collector-relayer-funder'), what: 'collect', params: [] }],
      },
      {
        where: dependency('smart-vault'),
        revokes: [],
        grants: [
          {
            who: dependency('relayer-funder-swapper'),
            what: 'execute',
            params: [{ op: OP.EQ, value: dependency('core/connectors/1inch-v5/v1.0.0-beta') }],
          },
        ],
      },
      {
        where: dependency('smart-vault'),
        revokes: [],
        grants: [{ who: dependency('relayer-funder-unwrapper'), what: 'unwrap', params: [] }],
      },
      {
        where: dependency('smart-vault'),
        revokes: [],
        grants: [{ who: dependency('relayer-depositor'), what: 'call', params: [] }],
      },
    ],
  },
  settings: {
    smartVault: dependency('smart-vault'),
    fee: {
      from: PROTOCOL_ADMIN,
      feeController: dependency('core/fee-controller/v1.0.0-beta'),
      maxFeePct: fp(0.02),
      feePct: fp(0.0001),
    },
    relayer: {
      from: PROTOCOL_ADMIN,
      relayer: dependency('core/relayer/v1.0.0-beta'),
      quota: fp(0.01),
    },
  },
}

export default deployment
