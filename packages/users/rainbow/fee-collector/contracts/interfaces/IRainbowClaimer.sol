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

import '@mimic-fi/v3-tasks/contracts/interfaces/ITask.sol';

/**
 * @title Rainbow claimer interface
 */
interface IRainbowClaimer is ITask {
    /**
     * @dev The token is zero
     */
    error TaskTokenZero();

    /**
     * @dev The amount is zero
     */
    error TaskAmountZero();

    /**
     * @dev The fee collector is zero
     */
    error TaskFeeCollectorZero();

    /**
     * @dev The safe is zero
     */
    error TaskSafeZero();

    /**
     * @dev The previous balance connector is not zero
     */
    error TaskPreviousConnectorNotZero(bytes32 id);

    /**
     * @dev Emitted every time the fee collector is set
     */
    event FeeCollectorSet(address indexed feeCollector);

    /**
     * @dev Emitted every time the safe is set
     */
    event SafeSet(address indexed safe);

    /**
     * @dev Tells the fee collector address
     */
    function feeCollector() external view returns (address);

    /**
     * @dev Tells the safe address
     */
    function safe() external view returns (address);

    /**
     * @dev Sets the fee claimer address. Sender must be authorized.
     * @param newFeeCollector Address of the fee collector to be set
     */
    function setFeeCollector(address newFeeCollector) external;

    /**
     * @dev Sets the safe address. Sender must be authorized.
     * @param newSafe Address of the safe to be set
     */
    function setSafe(address newSafe) external;

    /**
     * @dev Executes the Rainbow claimer task
     */
    function call(address token, uint256 amount) external;
}
