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
 * @title Paraswap claimer interface
 */
interface IParaswapClaimer is ITask {
    /**
     * @dev The token is zero
     */
    error TaskTokenZero();

    /**
     * @dev The amount is zero
     */
    error TaskAmountZero();

    /**
     * @dev The fee claimer is zero
     */
    error TaskFeeClaimerZero();

    /**
     * @dev The previous balance connector is not zero
     */
    error TaskPreviousConnectorNotZero(bytes32 id);

    /**
     * @dev The Paraswap claim failed
     */
    error TaskClaimFailed();

    /**
     * @dev Emitted every time the fee claimer is set
     */
    event FeeClaimerSet(address indexed feeClaimer);

    /**
     * @dev Tells the fee claimer address
     */
    function feeClaimer() external view returns (address);

    /**
     * @dev Sets the fee claimer address. Sender must be authorized.
     * @param newFeeClaimer Address of the fee claimer to be set
     */
    function setFeeClaimer(address newFeeClaimer) external;

    /**
     * @dev Executes the Paraswap claimer task
     */
    function call(address token, uint256 amount) external;
}
