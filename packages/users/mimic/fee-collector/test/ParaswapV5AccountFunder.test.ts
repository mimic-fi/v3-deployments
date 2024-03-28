import itBehavesLikeAnAccountFunder from './AccountFunder.behavior'

/* eslint-disable no-secrets/no-secrets */

describe('ParaswapV5AccountFunder', () => {
  itBehavesLikeAnAccountFunder('ParaswapV5AccountFunder', 'initializeParaswapV5AccountFunder', 'PARASWAP_V5_SWAPPER')
})
