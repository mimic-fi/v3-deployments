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
import '@mimic-fi/v3-tasks/contracts/primitives/Depositor.sol';

import './interfaces/INonERC20Depositor.sol';

/**
 * @title Non-ERC20 Depositor
 * @dev Task that can be used as the origin to start any workflow, for non-ERC20 tokens
 */
contract NonERC20Depositor is INonERC20Depositor, Depositor {
    // Balance of the smart vault before executing the Depositor
    uint256 private balanceBefore;

    /**
     * @dev Disables the default depositor initializer
     */
    function initialize(DepositConfig memory) external pure override {
        revert TaskInitializerDisabled();
    }

    /**
     * @dev Initializes the non-ERC20 depositor
     * @param config Deposit config
     */
    function initializeNonERC20Depositor(DepositConfig memory config) external virtual initializer {
        __NonERC20Depositor_init(config);
    }

    /**
     * @dev Initializes the non-ERC20 depositor. It does call upper contracts initializers.
     * @param config Deposit config
     */
    function __NonERC20Depositor_init(DepositConfig memory config) internal onlyInitializing {
        __Depositor_init(config);
        __NonERC20Depositor_init_unchained(config);
    }

    /**
     * @dev Initializes the non-ERC20 depositor. It does not call upper contracts initializers.
     * @param config Deposit config
     */
    function __NonERC20Depositor_init_unchained(DepositConfig memory config) internal onlyInitializing {
        // solhint-disable-previous-line no-empty-blocks
    }

    /**
     * @dev Before depositor hook
     */
    function _beforeDepositor(address token, uint256 amount) internal override {
        super._beforeDepositor(token, amount);
        balanceBefore = IERC20(token).balanceOf(smartVault);
    }

    /**
     * @dev After depositor hook
     */
    function _afterDepositor(address token, uint256) internal override {
        uint256 balanceAfter = IERC20(token).balanceOf(smartVault);
        uint256 amount = balanceAfter - balanceBefore;
        balanceBefore = 0;
        super._afterDepositor(token, amount);
    }
}
