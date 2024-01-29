// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@mimic-fi/v3-helpers/contracts/utils/ERC20Helpers.sol';

import '../interfaces/v6/IAugustusV6FeeVault.sol';

contract AugustusFeeVaultMock is IAugustusV6FeeVault {
    bool public fail;

    receive() external payable {
        // solhint-disable-previous-line no-empty-blocks
    }

    function mockFail(bool _fail) external {
        fail = _fail;
    }

    function getBalance(address token, address) external view override returns (uint256) {
        return ERC20Helpers.balanceOf(token, address(this));
    }

    function collect(address token, uint256 amount, address recipient, address) external override returns (bool) {
        ERC20Helpers.transfer(token, recipient, amount);
        return !fail;
    }
}
