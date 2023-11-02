import '@mimic-fi/v3-deployments-lib/dist/src/hardhat/deploy'
import '@mimic-fi/v3-deployments-lib/dist/src/hardhat/pending'
import '@mimic-fi/v3-deployments-lib/dist/src/hardhat/verify'
import '@mimic-fi/v3-helpers/dist/tests'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-local-networks-config-plugin'

import { homedir } from 'os'
import path from 'path'

export default {
  localNetworksConfig: path.join(homedir(), '/.hardhat/networks.mimic-v3.json'),
}
