import { OP } from '@mimic-fi/v3-authorizer'
import {
  dependency,
  DEPLOYER,
  EnvironmentDeployment,
  MIMIC_V2_BOT,
  PROTOCOL_ADMIN,
  USERS_ADMIN,
} from '@mimic-fi/v3-deployments-lib'
import { chainlink, fp, ONES_ADDRESS } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const ANYONE = ONES_ADDRESS

//Config - Gas
const QUOTA = 0

//Config - Fee
const FEE_PCT = fp(0.099) // 9.9%

const deployment: EnvironmentDeployment = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  authorizer: {
    from: DEPLOYER,
    name: 'authorizer',
    version: dependency('core/authorizer/v1.1.0'),
    owners: [USERS_ADMIN.safe],
  },
  priceOracle: {
    from: DEPLOYER,
    name: 'price-oracle',
    version: dependency('core/price-oracle/v1.0.0'),
    authorizer: dependency('authorizer'),
    signer: MIMIC_V2_BOT.address,
    pivot: chainlink.denominations.USD,
    feeds: [],
  },
  smartVault: {
    from: DEPLOYER,
    name: 'smart-vault',
    version: dependency('core/smart-vault/v1.0.0'),
    authorizer: dependency('authorizer'),
    priceOracle: dependency('price-oracle'),
  },
  tasks: [
    //1inch public swapper
    {
      from: DEPLOYER,
      name: '1inch-v5-public-swapper',
      version: 'OneInchV5PublicSwapper',
      args: [], //TODO: need a connector????!!!!!!
      config: {
        baseConfig: {
          smartVault: dependency('smart-vault'), //TODO: does not have prev o next!!!!!!!!
        },
        tokenIndexConfig: {
          acceptanceType: 0, //Deny list
          tokens: [],
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
        grants: [
          {
            who: dependency('1inch-v5-public-swapper'),
            what: 'collect',
            params: [],
          },
          {
            who: dependency('1inch-v5-public-swapper'),
            what: 'execute',
            params: [
              {
                op: OP.EQ,
                value: dependency('core/connectors/1inch-v5/v1.0.0'),
              },
            ],
          },
          {
            who: dependency('1inch-v5-public-swapper'),
            what: 'wrap',
            params: [],
          },
          {
            who: dependency('1inch-v5-public-swapper'),
            what: 'withdraw',
            params: [],
          },
        ],
      },
      {
        where: dependency('depositor'),
        revokes: [],
        grants: [{ who: ANYONE, what: 'call', params: [] }],
      },
    ],
  },
  feeSettings: {
    from: PROTOCOL_ADMIN,
    smartVault: dependency('smart-vault'),
    feeController: dependency('core/fee-controller/v1.0.0'), //TODO: how to redirect fee controller
    maxFeePct: fp(0.02), // 2%
    feePct: FEE_PCT,
  },
  relayerSettings: {
    from: PROTOCOL_ADMIN,
    smartVault: dependency('smart-vault'),
    relayer: dependency('core/relayer/v1.1.0'),
    quota: QUOTA,
  },
}

export default deployment
