import '@mimic-fi/v3-deployments-lib/dist/src/hardhat/deploy'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-local-networks-config-plugin'

import { homedir } from 'os'
import path from 'path'

export default {
  localNetworksConfig: path.join(homedir(), '/.hardhat/networks.mimic-v3.json'),
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
}
