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

pragma solidity >=0.8.0;

import '@mimic-fi/v3-tasks/contracts/interfaces/swap/IParaswapV5Swapper.sol';

/**
 * @dev Paraswap v5 account fund task interface
 */
interface IParaswapV5AccountFunder is IParaswapV5Swapper {
    /**
     * @dev The account is zero
     */
    error TaskAccountZero();

    /**
     * @dev The task initializer is disabled
     */
    error TaskInitializerDisabled();

    /**
     * @dev There is no threshold set for the given token
     */
    error TaskTokenThresholdNotSet(address token);

    /**
     * @dev The deposited amount is above the minimum threshold
     */
    error TaskBalanceAboveMinThreshold(uint256 balance, uint256 min);

    /**
     * @dev The requested amount would result in a new balance below the minimum threshold
     */
    error TaskNewBalanceBelowMinThreshold(uint256 balance, uint256 min);

    /**
     * @dev The requested amount would result in a new balance above the maximum threshold
     */
    error TaskNewBalanceAboveMaxThreshold(uint256 balance, uint256 max);

    /**
     * @dev Emitted every time the account is set
     */
    event AccountSet(address indexed account);

    /**
     * @dev Tells the account
     */
    function account() external view returns (address);

    /**
     * @dev Sets the account
     * @param newAccount Address of the account to be set
     */
    function setAccount(address newAccount) external;
}
