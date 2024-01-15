import { OP } from '@mimic-fi/v3-authorizer'
import { dependency, DEPLOYER, EnvironmentUpdate, PROTOCOL_ADMIN, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, ONES_ADDRESS } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const ANYONE = ONES_ADDRESS

//Config - Fee
const BT_FEE_PCT = fp(0.007) // 0.7%

//Config - Gas
const QUOTA = 0

/*
tw-android
tw-ios
tw-browser-extension
defi-android
defi-ios
*/

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'bt-swapper',
  steps: [
    {
      from: DEPLOYER,
      name: 'smart-vault-tw-android',
      version: dependency('core/smart-vault/v1.0.0'),
      authorizer: dependency('2023111100-public-fee-collector-environment-deploy', 'authorizer'),
      priceOracle: dependency('2023111100-public-fee-collector-environment-deploy', 'price-oracle'),
    },
    //1inch public swapper
    {
      from: DEPLOYER,
      name: '1inch-v5-public-swapper-tw-android',
      version: 'OneInchV5PublicSwapper',
      initialize: 'initializePublicSwapper',
      args: [dependency('core/connectors/1inch-v5/v1.0.0')],
      config: {
        baseConfig: {
          smartVault: dependency('smart-vault-tw-android'),
        },
        tokenIndexConfig: {
          acceptanceType: 0, //Deny list
          tokens: [],
        },
      },
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-public-fee-collector-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('smart-vault-tw-android'),
          revokes: [],
          grants: [
            {
              who: dependency('1inch-v5-public-swapper-tw-android'),
              what: 'collect',
              params: [],
            },
            {
              who: dependency('1inch-v5-public-swapper-tw-android'),
              what: 'execute',
              params: [
                {
                  op: OP.EQ,
                  value: dependency('core/connectors/1inch-v5/v1.0.0'),
                },
              ],
            },
            {
              who: dependency('1inch-v5-public-swapper-tw-android'),
              what: 'wrap',
              params: [],
            },
            {
              who: dependency('1inch-v5-public-swapper-tw-android'),
              what: 'unwrap',
              params: [],
            },
            {
              who: dependency('1inch-v5-public-swapper-tw-android'),
              what: 'withdraw',
              params: [],
            },
          ],
        },
        {
          where: dependency('1inch-v5-public-swapper-tw-android'),
          revokes: [],
          grants: [{ who: ANYONE, what: 'call', params: [] }],
        },
      ],
    },
    {
      from: PROTOCOL_ADMIN,
      smartVault: dependency('smart-vault-tw-android'),
      feeController: dependency('core/fee-controller/v1.0.0'),
      feeCollector: dependency('2023111100-public-fee-collector-environment-deploy', 'depositor'), //Collector
      maxFeePct: fp(0.02), // 2%
      feePct: BT_FEE_PCT,
    },
    {
      from: PROTOCOL_ADMIN,
      smartVault: dependency('smart-vault-tw-android'),
      relayer: dependency('core/relayer/v1.1.0'),
      quota: QUOTA,
    },
  ],
}

export default update
