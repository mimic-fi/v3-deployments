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

import './IProtocolFeeWithdrawer.sol';

/**
 * @title Balancer claimer interface
 */
interface IBalancerClaimer is ITask {
    /**
     * @dev The token is zero
     */
    error TaskTokenZero();

    /**
     * @dev The amount is zero
     */
    error TaskAmountZero();

    /**
     * @dev The protocol fee withdrawer is zero
     */
    error TaskProtocolFeeWithdrawerZero();

    /**
     * @dev The protocol fees collector is zero
     */
    error TaskProtocolFeesCollectorZero();

    /**
     * @dev The previous balance connector is not zero
     */
    error TaskPreviousConnectorNotZero(bytes32 id);

    /**
     * @dev Emitted every time the protocol fee withdrawer is set
     */
    event ProtocolFeeWithdrawerSet(address indexed protocolFeeWithdrawer);

    /**
     * @dev Emitted every time the protocol fees collector is set
     */
    event ProtocolFeesCollectorSet(address indexed protocolFeesCollector);

    /**
     * @dev Tells the protocol fee withdrawer address
     */
    function protocolFeeWithdrawer() external view returns (address);

    /**
     * @dev Tells the protocol fee collector address
     */
    function protocolFeesCollector() external view returns (address);

    /**
     * @dev Sets the protocol fee withdrawer address. Sender must be authorized.
     * @param newProtocolFeeWithdrawer Address of the protocol fee withdrawer to be set
     */
    function setProtocolFeeWithdrawer(address newProtocolFeeWithdrawer) external;

    /**
     * @dev Sets the protocol fees collector address. Sender must be authorized.
     * @param newProtocolFeesCollector Address of the protocol fees collector to be set
     */
    function setProtocolFeesCollector(address newProtocolFeesCollector) external;

    /**
     * @dev Executes the Balancer claimer task
     */
    function call(address token, uint256 amount) external;
}
