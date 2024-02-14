import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const TOKENS = [
  '0x7fc9e0aa043787bfad28e29632ada302c790ce33',
  '0xac2cae8d2f78a4a8f92f20dbe74042cd0a8d5af3',
  '0x726e324c29a1e49309672b244bdc4ff62a270407',
  '0x130ce4e4f76c2265f94a961d70618562de0bb8d2',
  '0x4f025829c4b13df652f38abd2ab901185ff1e609',
  '0xd6ca869a4ec9ed2c7e618062cdc45306d8dbbc14',
  '0x340f412860da7b7823df372a2b59ff78b7ae6abc',
  '0xbae28251b2a4e621aa7e20538c06dee010bc06de',
]

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024011602-deploy-other-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024011801-redeploy-migration-task', 'migration-claimer-v3'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011801-redeploy-migration-task', 'migration-claimer-v3'),
      method: 'setTokensAcceptanceList',
      args: [
        [TOKENS[0], TOKENS[1], TOKENS[2], TOKENS[3], TOKENS[4], TOKENS[5], TOKENS[6], TOKENS[7]],
        [true, true, true, true, true, true, true, true],
      ],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024011602-deploy-other-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024011801-redeploy-migration-task', 'migration-claimer-v3'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
