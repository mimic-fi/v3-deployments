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

import '@mimic-fi/v3-helpers/contracts/utils/ERC20Helpers.sol';

import './BalancerClaimer.sol';
import './interfaces/INonERC20BalancerClaimer.sol';

/**
 * @title Non-ERC20 Balancer claimer
 * @dev Task used to claim non-ERC20 tokens from Balancer's protocol fee withdrawer
 */
contract NonERC20BalancerClaimer is INonERC20BalancerClaimer, BalancerClaimer {
    // Balance of the smart vault before executing the Balancer claimer task
    uint256 private balanceBefore;

    /**
     * @dev Disables the default balancer claimer initializer
     */
    function initializeBalancerClaimer(TaskConfig memory, address, address) external pure override {
        revert TaskInitializerDisabled();
    }

    /**
     * @dev Initializes the non-ERC20 balancer claimer
     * @param config Task config
     * @param withdrawer Protocol fee withdrawer address
     * @param collector Protocol fee collector address
     */
    function initializeNonERC20BalancerClaimer(TaskConfig memory config, address withdrawer, address collector)
        external
        virtual
        initializer
    {
        __NonERC20BalancerClaimer_init(config, withdrawer, collector);
    }

    /**
     * @dev Initializes the non-ERC20 balancer claimer. It does call upper contracts initializers.
     * @param config Task config
     * @param withdrawer Protocol fee withdrawer address
     * @param collector Protocol fee collector address
     */
    function __NonERC20BalancerClaimer_init(TaskConfig memory config, address withdrawer, address collector)
        internal
        onlyInitializing
    {
        __BalancerClaimer_init(config, withdrawer, collector);
        __NonERC20BalancerClaimer_init_unchained(config, withdrawer, collector);
    }

    /**
     * @dev Initializes the non-ERC20 balancer claimer. It does not call upper contracts initializers.
     * @param config Task config
     * @param withdrawer Protocol fee withdrawer address
     * @param collector Protocol fee collector address
     */
    function __NonERC20BalancerClaimer_init_unchained(TaskConfig memory config, address withdrawer, address collector)
        internal
        onlyInitializing
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    /**
     * @dev Before balancer claimer task hook
     */
    function _beforeBalancerClaimer(address token, uint256 amount) internal override {
        super._beforeBalancerClaimer(token, amount);
        balanceBefore = IERC20(token).balanceOf(smartVault);
    }

    /**
     * @dev After balancer claimer task hook
     */
    function _afterBalancerClaimer(address token, uint256) internal override {
        uint256 balanceAfter = IERC20(token).balanceOf(smartVault);
        uint256 amount = balanceAfter - balanceBefore;
        balanceBefore = 0;
        super._afterBalancerClaimer(token, amount);
    }
}
