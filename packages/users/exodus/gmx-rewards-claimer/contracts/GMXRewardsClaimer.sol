// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import '@mimic-fi/v3-tasks/contracts/Task.sol';

import './interfaces/IGMXRewardsClaimer.sol';
import './interfaces/IExchangeRouter.sol';

/**
 * @title GMX rewards claimer
 * @dev Task used to claim GMX affiliate rewards
 */
contract GMXRewardsClaimer is IGMXRewardsClaimer, Task {
    // Execution type for relayers
    bytes32 public constant override EXECUTION_TYPE = keccak256('GMX_REWARDS_CLAIMER');

    // GMX exchange router address
    address public override gmxExchangeRouter;

    /**
     * @dev Initializes the GMX rewards claimer
     * @param config Task config
     * @param _gmxExchangeRouter GMX exchange router address
     */
    function initializeGMXRewardsClaimer(TaskConfig memory config, address _gmxExchangeRouter)
        external
        virtual
        initializer
    {
        __GMXRewardsClaimer_init(config, _gmxExchangeRouter);
    }

    /**
     * @dev Initializes the GMX rewards claimer. It does call upper contracts initializers.
     * @param config Task config
     * @param _gmxExchangeRouter GMX exchange router address
     */
    function __GMXRewardsClaimer_init(TaskConfig memory config, address _gmxExchangeRouter) internal onlyInitializing {
        __Task_init(config);
        __GMXRewardsClaimer_init_unchained(config, _gmxExchangeRouter);
    }

    /**
     * @dev Initializes the GMX rewards claimer. It does not call upper contracts initializers.
     * @param _gmxExchangeRouter GMX exchange router address
     */
    function __GMXRewardsClaimer_init_unchained(TaskConfig memory, address _gmxExchangeRouter)
        internal
        onlyInitializing
    {
        _setGmxExchangeRouter(_gmxExchangeRouter);
    }

    /**
     * @dev Tells the address from where the token amounts to execute this task are fetched
     */
    function getTokensSource() external view virtual override(IBaseTask, BaseTask) returns (address) {
        return IExchangeRouter(gmxExchangeRouter).dataStore();
    }

    /**
     * @dev Tells the amount a task should use for a token, in this case always zero since it is not
     * possible to claim a specific number of tokens
     */
    function getTaskAmount(address) public pure virtual override(IBaseTask, BaseTask) returns (uint256) {
        return 0;
    }

    /**
     * @dev Sets the GMX exchange router address. Sender must be authorized.
     * @param newGmxExchangeRouter Address of the GMX exchange router to be set
     */
    function setGmxExchangeRouter(address newGmxExchangeRouter)
        external
        override
        authP(authParams(newGmxExchangeRouter))
    {
        _setGmxExchangeRouter(newGmxExchangeRouter);
    }

    /**
     * @dev Executes the GMX rewards claimer task
     * @param token Address of the token to claim rewards for
     * @param amount Must be zero, it is not possible to claim a specific number of tokens
     * @param markets Addresses of the markets to claim rewards for
     */
    function call(address token, uint256 amount, address[] memory markets)
        external
        override
        authP(authParams(token, amount))
    {
        _beforeGMXRewardsClaimer(token, amount, markets);
        uint256 preBalance = IERC20(token).balanceOf(smartVault);

        // solhint-disable-next-line avoid-low-level-calls
        ISmartVault(smartVault).call(gmxExchangeRouter, _buildGMXRewardsClaimerData(token, markets), 0);

        uint256 postBalance = IERC20(token).balanceOf(smartVault);
        uint256 amountClaimed = postBalance - preBalance;
        _afterGMXRewardsClaimer(token, amountClaimed, markets);
    }

    /**
     * @dev Builds GMX exchange router calldata
     */
    function _buildGMXRewardsClaimerData(address token, address[] memory markets) internal view returns (bytes memory) {
        address[] memory tokens = new address[](markets.length);
        for (uint256 i = 0; i < markets.length; i++) tokens[i] = token;
        // Note `claimAffiliateRewards` receives `markets` as the first parameter and `tokens` as the second one
        return abi.encodeWithSelector(IExchangeRouter.claimAffiliateRewards.selector, markets, tokens, smartVault);
    }

    /**
     * @dev Before GMX rewards claimer task hook
     */
    function _beforeGMXRewardsClaimer(address token, uint256 amount, address[] memory markets) internal virtual {
        _beforeTask(token, amount);
        if (token == address(0)) revert TaskTokenZero();
        if (amount != 0) revert TaskAmountNotZero();
        if (markets.length == 0) revert TaskMarketsEmpty();
        for (uint256 i = 0; i < markets.length; i++) if (markets[i] == address(0)) revert TaskMarketZero(i);
    }

    /**
     * @dev After GMX rewards claimer task hook
     */
    function _afterGMXRewardsClaimer(address token, uint256 amount, address[] memory) internal virtual {
        _increaseBalanceConnector(token, amount);
        _afterTask(token, amount);
    }

    /**
     * @dev Sets the GMX exchange router address
     * @param newGmxExchangeRouter Address of the GMX exchange router to be set
     */
    function _setGmxExchangeRouter(address newGmxExchangeRouter) internal {
        if (newGmxExchangeRouter == address(0)) revert TaskGmxExchangeRouterZero();
        gmxExchangeRouter = newGmxExchangeRouter;
        emit GmxExchangeRouterSet(newGmxExchangeRouter);
    }

    /**
     * @dev Sets the balance connectors. Previous balance connector must be unset.
     * @param previous Balance connector id of the previous task in the workflow
     * @param next Balance connector id of the next task in the workflow
     */
    function _setBalanceConnectors(bytes32 previous, bytes32 next) internal virtual override {
        if (previous != bytes32(0)) revert TaskPreviousConnectorNotZero(previous);
        super._setBalanceConnectors(previous, next);
    }
}
