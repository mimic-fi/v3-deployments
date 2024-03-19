// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../interfaces/IExchangeRouter.sol';

contract ExchangeRouterMock is IExchangeRouter {
    using SafeERC20 for IERC20;

    uint256 public pendingRewards;

    constructor(uint256 _pendingRewards) {
        pendingRewards = _pendingRewards;
    }

    function dataStore() external pure returns (address) {
        return address(0);
    }

    function claimAffiliateRewards(address[] memory, address[] memory tokens, address receiver)
        external
        returns (uint256[] memory amounts)
    {
        IERC20(tokens[0]).safeTransfer(receiver, pendingRewards);
        amounts = new uint256[](1);
        amounts[0] = pendingRewards;
        pendingRewards = 0;
    }
}
