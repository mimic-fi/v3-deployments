/* eslint-disable no-secrets/no-secrets */

import { EOA, SafeSigner, SmartVaultAccount } from './types'

export const ORIGIN: EOA = {
  address: '0xA5b0b07E68ebF69D6659eC5c78Da616b6B2573B0',
}

export const DEPLOYER: EOA = {
  address: '0x14C108D06244D664388Db620dF6A13DEC0C97960',
}

export const PROTOCOL_ADMIN: SafeSigner = {
  safe: '0x6c0542DAeE8Cc6866529D4a68163eb157Fb78999',
  signer: DEPLOYER.address,
  wait: true,
}

export const USERS_ADMIN: SafeSigner = {
  safe: '0x26A0c29261d18C49e6Cf0Cee175018274D58f90C',
  signer: DEPLOYER.address,
  wait: true,
}

export const MIMIC_V2_BOT: EOA = {
  address: '0xB3AfB6DB38a8E72905165c1fBB96772e63560790',
}

export const MIMIC_V2_FEE_COLLECTOR: SmartVaultAccount = {
  sv: '0x4629C578a9e49Ef4AaABFeE03F238cB11625F78B',
  sender: '0xfACCB9EAb53E669f6A382bb4507A131961E94C8B',
}
