// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.0;

contract FeeControllerMock {
    function hasFee(address smartVault) external view returns (bool) {
        return true;
    }

    function getFee(address smartVault) external view returns (uint256 max, uint256 pct, address collector) {
        return (0, 0, address(0));
    }
}
