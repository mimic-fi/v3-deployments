import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp } from '@mimic-fi/v3-helpers'

const token1 = ['0x468003b688943977e6130f4f68f23aad939a1040', fp(0.68)] //SPELL
const token2 = ['0xbf4906762c38f50bc7be0a11bb452c944f6c72e1', fp(0.2)] //SHARP
const token3 = ['0x321162cd933e2be498cd2267a90534a804051b11', fp(0.97)] //BTCmulti
const token4 = ['0x74b23882a30290451a17c44f4f05243b6b58c76d', fp(0.95)] //ETHmulti
const token5 = ['0xd67de0e0a0fd7b15dc8348bb9be742f3c5850454', fp(0.85)] //BNBmulti

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setCustomMaxSlippage', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', '1inch-swapper'),
      method: 'setCustomMaxSlippage',
      args: [token1[0], token1[1]],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', '1inch-swapper'),
      method: 'setCustomMaxSlippage',
      args: [token2[0], token2[1]],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', '1inch-swapper'),
      method: 'setCustomMaxSlippage',
      args: [token3[0], token3[1]],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', '1inch-swapper'),
      method: 'setCustomMaxSlippage',
      args: [token4[0], token4[1]],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', '1inch-swapper'),
      method: 'setCustomMaxSlippage',
      args: [token5[0], token5[1]],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setCustomMaxSlippage' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
