import { Account, EOA, SafeSigner, SmartVaultAccount } from './types'

export function isEOA(account: Account): account is EOA {
  return !!(account as EOA).address
}

export function isSafeSigner(account: Account): account is SafeSigner {
  const safeSigner = account as SafeSigner
  return !!safeSigner.signer && !!safeSigner.safe
}

export function isSmartVaultAccount(account: Account): account is SmartVaultAccount {
  const svAccount = account as SmartVaultAccount
  return !!svAccount.sv && !!svAccount.sender
}
