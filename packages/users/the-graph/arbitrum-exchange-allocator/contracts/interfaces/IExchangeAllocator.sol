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

import '@mimic-fi/v3-tasks/contracts/interfaces/primitives/ICollector.sol';

/**
 * @title Exchange allocator interface
 */
interface IExchangeAllocator is ICollector {
    /**
     * @dev The allocation exchange address is zero
     */
    error TaskAllocationExchangeZero();

    /**
     * @dev The task initializer is disabled
     */
    error TaskInitializerDisabled();

    /**
     * @dev There is no threshold set for the given token
     */
    error TaskTokenThresholdNotSet(address token);

    /**
     * @dev The current allocation exchange balance is above the minimum threshold
     */
    error TaskAllocationBalanceAboveMin(uint256 balance, uint256 min);

    /**
     * @dev The current allocation exchange balance is below the minimum threshold
     */
    error TaskNewAllocationBalanceBelowMin(uint256 balance, uint256 min);

    /**
     * @dev The new allocation exchange balance is above the maximum threshold
     */
    error TaskNewAllocationBalanceAboveMax(uint256 balance, uint256 max);

    /**
     * @dev Emitted every time the allocation exchange address is set
     */
    event AllocationExchangeSet(address indexed allocationExchange);

    /**
     * @dev Tells the allocation exchange address
     */
    function allocationExchange() external view returns (address);

    /**
     * @dev Sets the allocation exchange address
     * @param newAllocationExchange Address of the allocation exchange to be set
     */
    function setAllocationExchange(address newAllocationExchange) external;
}
