// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@mimic-fi/v3-helpers/contracts/utils/ERC20Helpers.sol';

import '../interfaces/v5/IFeeClaimer.sol';

contract FeeClaimerMock is IFeeClaimer {
    bool public fail;

    receive() external payable {
        // solhint-disable-previous-line no-empty-blocks
    }

    function mockFail(bool _fail) external {
        fail = _fail;
    }

    function augustusSwapper() external pure override returns (address) {
        return address(0);
    }

    function getBalance(address token, address) external view override returns (uint256) {
        return ERC20Helpers.balanceOf(token, address(this));
    }

    function registerFee(address, address, uint256) external override {
        // solhint-disable-previous-line no-empty-blocks
    }

    function withdrawSomeERC20(address token, uint256 amount, address recipient) external override returns (bool) {
        ERC20Helpers.transfer(token, recipient, amount);
        return !fail;
    }
}
