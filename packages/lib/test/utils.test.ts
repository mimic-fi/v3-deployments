import { expect } from 'chai'
import { utils } from 'ethers'

import { balanceConnectorId } from '../src/utils'

describe('utils', () => {
  describe('balanceConnectorId', () => {
    it('encodes a balance connector ID properly', async () => {
      expect(balanceConnectorId('withdrawer')).to.be.equal(utils.solidityKeccak256(['string'], ['withdrawer']))
    })
  })
})
