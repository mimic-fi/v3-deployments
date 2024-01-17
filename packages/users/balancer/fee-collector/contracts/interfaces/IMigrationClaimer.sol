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
import '@mimic-fi/v3-smart-vault/contracts/interfaces/ISmartVault.sol';

/**
 * @title Balancer claimer interface
 */
interface IMigrationClaimer is ITask {
    /**
     * @dev The token is zero
     */
    error TaskTokenZero();

    /**
     * @dev The amount is zero
     */
    error TaskAmountZero();

    /**
     * @dev The source smart vault is zero
     */
    error TaskSourceSmartVaultZero();

    /**
     * @dev The depositor is zero
     */
    error TaskDepositorZero();

    /**
     * @dev The previous balance connector is not zero
     */
    error TaskPreviousConnectorNotZero(bytes32 id);

    /**
     * @dev Emitted every time the source smart vault is set
     */
    event SourceSmartVaultSet(address indexed sourceSmartVault);

    /**
     * @dev Emitted every time the depositor is set
     */
    event DepositorSet(address indexed depositor);

    /**
     * @dev Tells the source smart vault address
     */
    function sourceSmartVault() external view returns (address);

    /**
     * @dev Tells the depositor address
     */
    function depositor() external view returns (address);

    /**
     * @dev Sets the source smart vault address. Sender must be authorized.
     * @param newSourceSmartVault Address of the source smart vault to be set
     */
    function setSourceSmartVault(address newSourceSmartVault) external;

    /**
     * @dev Sets the depositor address. Sender must be authorized.
     * @param newDepositor Address of the depositor to be set
     */
    function setDepositor(address newDepositor) external;

    /**
     * @dev Executes the Migration claimer task
     */
    function call(address token, uint256 amount) external;
}