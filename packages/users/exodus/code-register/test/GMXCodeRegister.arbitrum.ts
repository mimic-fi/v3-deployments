import { itBehavesLikeGMXCodeRegister } from './GMXCodeRegister.behavior'

const REFERRAL_STORAGE = '0xe6fab3f0c7199b0d34d7fbe83394fc0e0d06e99d'
const WHALE = '0xBA12222222228d8Ba445958a75a0704d566BF2C8'

describe('GMXCodeRegister', () => {
  itBehavesLikeGMXCodeRegister(REFERRAL_STORAGE, WHALE)
})
