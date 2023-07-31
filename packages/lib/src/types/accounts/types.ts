export type EOA = {
  address: string
}

export type SafeSigner = {
  safe: string
  signer: string
}

export type SmartVaultAccount = {
  sv: string
  sender: string
}

export type Account = EOA | SafeSigner | SmartVaultAccount
