import { expect } from 'chai'

import { DEPLOYER, MIMIC_V2_BOT, MIMIC_V2_FEE_COLLECTOR, ORIGIN, PROTOCOL_ADMIN, USERS_ADMIN } from '../src/accounts'
import { isEOA, isSafeSigner } from '../src/types'

describe('accounts', () => {
  describe('origin', () => {
    it('is an EOA', async () => {
      expect(isEOA(ORIGIN)).to.be.true
    })
  })

  describe('deployer', () => {
    it('is an EOA', async () => {
      expect(isEOA(DEPLOYER)).to.be.true
    })
  })

  describe('protocol admin', () => {
    it('is a safe signer', async () => {
      expect(isSafeSigner(PROTOCOL_ADMIN)).to.be.true
      expect(PROTOCOL_ADMIN.wait).to.be.true
    })
  })

  describe('users admin', () => {
    it('is a safe signer', async () => {
      expect(isSafeSigner(USERS_ADMIN)).to.be.true
      expect(USERS_ADMIN.wait).to.be.true
    })
  })

  describe('mimic bot', () => {
    it('is an EOA', async () => {
      expect(isEOA(MIMIC_V2_BOT)).to.be.true
    })
  })

  describe('mimic sv', () => {
    it('is a SV', async () => {
      expect(!isEOA(MIMIC_V2_FEE_COLLECTOR) && !isSafeSigner(MIMIC_V2_FEE_COLLECTOR)).to.be.true
    })
  })
})
