// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@mimic-fi/v3-helpers/contracts/utils/ERC20Helpers.sol';

import '../interfaces/IFeeCollector.sol';

contract FeeCollectorMock is IFeeCollector {
    bool public fail;

    receive() external payable {
        // solhint-disable-previous-line no-empty-blocks
    }

    function getBalance(address token) external view returns (uint256) {
        return ERC20Helpers.balanceOf(token, address(this));
    }

    function registerFee(address, address, uint256) external {
        // solhint-disable-previous-line no-empty-blocks
    }

    function collectETHFees(uint256 amount) external override {
        (bool success, ) = address(msg.sender).call{ value: amount }('');
    }

    function collectTokenFees(address token, uint256 amount) external override {
        ERC20Helpers.transfer(token, msg.sender, amount);
    }
}
