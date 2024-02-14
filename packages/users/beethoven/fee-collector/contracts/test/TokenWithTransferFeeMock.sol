// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

import '@mimic-fi/v3-helpers/contracts/math/FixedPoint.sol';

contract TokenWithTransferFeeMock is ERC20 {
    using FixedPoint for uint256;

    uint256 internal _fee;

    constructor(string memory symbol, uint256 fee) ERC20(symbol, symbol) {
        _fee = fee;
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal virtual override {
        super._transfer(from, to, amount.mulDown(FixedPoint.ONE - _fee));
        super._transfer(from, address(this), amount.mulDown(_fee));
    }
}
