// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../interfaces/IGNSMultiCollatDiamond.sol';

contract GNSMultiCollatDiamondMock is IGNSMultiCollatDiamond {
    using SafeERC20 for IERC20;

    uint256 public pendingRewards;
    address public gnsToken;

    constructor(uint256 _pendingRewards, address _gnsToken) {
        pendingRewards = _pendingRewards;
        gnsToken = _gnsToken;
    }

    function getAddresses() external view returns (Addresses memory) {
        return Addresses({ gns: gnsToken });
    }

    function claimReferrerRewards() external {
        IERC20(gnsToken).safeTransfer(msg.sender, pendingRewards);
        pendingRewards = 0;
    }
}
