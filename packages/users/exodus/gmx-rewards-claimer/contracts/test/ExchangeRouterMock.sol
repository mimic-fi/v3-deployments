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

    function setPendingRewards(uint256 newPendingRewards) external {
        pendingRewards = newPendingRewards;
    }

    function dataStore() external view returns (address) {
        return address(0);
    }

    function claimAffiliateRewards(address[] memory, address[] memory tokens, address receiver)
        external
        returns (uint256[] memory)
    {
        IERC20(tokens[0]).safeTransfer(receiver, pendingRewards);
        pendingRewards = 0;
    }
}
