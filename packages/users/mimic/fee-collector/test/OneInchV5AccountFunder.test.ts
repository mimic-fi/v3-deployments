import itBehavesLikeAnAccountFunder from './AccountFunder.behavior'

/* eslint-disable no-secrets/no-secrets */

describe('OneInchV5AccountFunder', () => {
  itBehavesLikeAnAccountFunder('OneInchV5AccountFunder', 'initializeOneInchV5AccountFunder', '1INCH_V5_SWAPPER')
})
