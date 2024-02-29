import { deployProxy, fp, impersonate, instanceAt } from '@mimic-fi/v3-helpers'
import { buildEmptyTaskConfig, deployEnvironment } from '@mimic-fi/v3-tasks'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract } from 'ethers'

export function itBehavesLikeGMXCodeRegister(REFERRAL_STORAGE: string, WHALE: string): void {
  let referralStorage: Contract, authorizer: Contract, smartVault: Contract, task: Contract
  let whale: SignerWithAddress

  before('load instances and accounts', async function () {
    referralStorage = await instanceAt('IReferralStorage', REFERRAL_STORAGE)
    whale = await impersonate(WHALE, fp(100))
  })

  before('setup', async () => {
    // eslint-disable-next-line prettier/prettier
    ({ authorizer, smartVault } = await deployEnvironment(whale))
  })

  before('create task', async function () {
    task = await deployProxy(
      'GMXCodeRegister',
      [],
      [buildEmptyTaskConfig(whale, smartVault), REFERRAL_STORAGE],
      'initializeGMXCodeRegister'
    )
  })

  beforeEach('authorize task', async () => {
    const callRole = smartVault.interface.getSighash('call')
    await authorizer.connect(whale).authorize(task.address, smartVault.address, callRole, [])
  })

  beforeEach('authorize sender', async () => {
    const callRole = task.interface.getSighash('call')
    await authorizer.connect(whale).authorize(whale.address, task.address, callRole, [])
  })

  context('when the task is called', () => {
    const code = '0x0000000000000000000000000000000000000000000000000000000000000001'

    it('registers the code correctly', async function () {
      await task.connect(whale).call(code)

      const codeOwner = await referralStorage.codeOwners(code)
      expect(codeOwner).to.be.equal(smartVault.address)
    })
  })
}
