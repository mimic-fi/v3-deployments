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

import './interfaces/IGainsTradeRewardsClaimer.sol';
import './interfaces/IGNSMultiCollatDiamond.sol';

/**
 * @title GainsTrade rewards claimer
 * @dev Task used to claim GNS tokens from gTrade protocol
 */
contract GainsTradeRewardsClaimer is IGainsTradeRewardsClaimer, Task {
    // Execution type for relayers
    bytes32 public constant override EXECUTION_TYPE = keccak256('GAINS_TRADE_REWARDS_CLAIMER');

    // GNS multi collat diamond address
    address public override gnsMultiCollatDiamond;

    /**
     * @dev Initializes the GainsTrade rewards claimer
     * @param config Task config
     * @param _gnsMultiCollatDiamond GNS multi collat diamond address
     */
    function initializeGainsTradeRewardsClaimer(TaskConfig memory config, address _gnsMultiCollatDiamond)
        external
        virtual
        initializer
    {
        __GainsTradeRewardsClaimer_init(config, _gnsMultiCollatDiamond);
    }

    /**
     * @dev Initializes the GainsTrade rewards claimer. It does call upper contracts initializers.
     * @param config Task config
     * @param _gnsMultiCollatDiamond GNS multi collat diamond address
     */
    function __GainsTradeRewardsClaimer_init(TaskConfig memory config, address _gnsMultiCollatDiamond)
        internal
        onlyInitializing
    {
        __Task_init(config);
        __GainsTradeRewardsClaimer_init_unchained(config, _gnsMultiCollatDiamond);
    }

    /**
     * @dev Initializes the GainsTrade rewards claimer. It does not call upper contracts initializers.
     * @param _gnsMultiCollatDiamond GNS multi collat diamond address
     */
    function __GainsTradeRewardsClaimer_init_unchained(TaskConfig memory, address _gnsMultiCollatDiamond)
        internal
        onlyInitializing
    {
        _setGnsMultiCollatDiamond(_gnsMultiCollatDiamond);
    }

    /**
     * @dev Tells the address from where the token amounts to execute this task are fetched
     */
    function getTokensSource() external view virtual override(IBaseTask, BaseTask) returns (address) {
        return gnsMultiCollatDiamond;
    }

    /**
     * @dev Tells the amount a task should use for a token. In this case it is the unclaimed rewards amount.
     */
    function getTaskAmount(address) public view virtual override(IBaseTask, BaseTask) returns (uint256) {
        return IGNSMultiCollatDiamond(gnsMultiCollatDiamond).getReferrerDetails(smartVault).pendingRewardsToken;
    }

    /**
     * @dev Sets the GNS multi collat diamond address. Sender must be authorized.
     * @param newGnsMultiCollatDiamond Address of the GNS contract to be set
     */
    function setGnsMultiCollatDiamond(address newGnsMultiCollatDiamond)
        external
        override
        authP(authParams(newGnsMultiCollatDiamond))
    {
        _setGnsMultiCollatDiamond(newGnsMultiCollatDiamond);
    }

    /**
     * @dev Executes the GainsTrade rewards claimer task
     */
    function call(address token, uint256 amount) external override authP(authParams(token, amount)) {
        if (amount == 0) amount = getTaskAmount(token);
        _beforeGainsTradeRewardsClaimer(token, amount);
        uint256 preBalance = IERC20(token).balanceOf(smartVault);

        bytes memory data = abi.encodeWithSelector(IGNSMultiCollatDiamond.claimReferrerRewards.selector);
        // solhint-disable-next-line avoid-low-level-calls
        ISmartVault(smartVault).call(gnsMultiCollatDiamond, data, 0);

        uint256 postBalance = IERC20(token).balanceOf(smartVault);
        uint256 amountClaimed = postBalance - preBalance;
        _afterGainsTradeRewardsClaimer(token, amountClaimed);
    }

    /**
     * @dev Before GainsTrade rewards claimer task hook
     */
    function _beforeGainsTradeRewardsClaimer(address token, uint256 amount) internal virtual {
        _beforeTask(token, amount);
        address gnsToken = IGNSMultiCollatDiamond(gnsMultiCollatDiamond).getAddresses().gns;
        if (token != gnsToken) revert TaskTokenNotGns(token, gnsToken);
        if (amount == 0) revert TaskAmountZero();
    }

    /**
     * @dev After GainsTrade rewards claimer task hook
     */
    function _afterGainsTradeRewardsClaimer(address token, uint256 amount) internal virtual {
        _increaseBalanceConnector(token, amount);
        _afterTask(token, amount);
    }

    /**
     * @dev Sets the GNS multi collat diamond address
     * @param newGnsMultiCollatDiamond Address of the GNS contract to be set
     */
    function _setGnsMultiCollatDiamond(address newGnsMultiCollatDiamond) internal {
        if (newGnsMultiCollatDiamond == address(0)) revert TaskGnsMultiCollatDiamondZero();
        gnsMultiCollatDiamond = newGnsMultiCollatDiamond;
        emit GnsMultiCollatDiamondSet(newGnsMultiCollatDiamond);
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
