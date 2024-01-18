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

import '@mimic-fi/v3-tasks/contracts/Task.sol';
import '@mimic-fi/v3-helpers/contracts/utils/ERC20Helpers.sol';
import '@mimic-fi/v3-smart-vault/contracts/interfaces/ISmartVault.sol';

import './interfaces/IMigrationClaimer.sol';
import './interfaces/IOldSmartVault.sol';

/**
 * @title Balancer claimer
 * @dev Task used to claim tokens from Balancer's Source smart vault
 */
contract MigrationClaimer is IMigrationClaimer, Task {
    // Execution type for relayers
    bytes32 public constant override EXECUTION_TYPE = keccak256('MIGRATION_CLAIMER');

    // Source smart vault address
    address public override sourceSmartVault;

    /**
     * @dev Initializes the balancer claimer
     * @param config Task config
     * @param smartVault Source smart vault address
     */
    function initializeMigrationClaimer(TaskConfig memory config, address smartVault) external virtual initializer {
        __MigrationClaimer_init(config, smartVault);
    }

    /**
     * @dev Initializes the balancer claimer. It does call upper contracts initializers.
     * @param config Task config
     * @param smartVault Source smart vault address
     */
    function __MigrationClaimer_init(TaskConfig memory config, address smartVault) internal onlyInitializing {
        __Task_init(config);
        __MigrationClaimer_init_unchained(config, smartVault);
    }

    /**
     * @dev Initializes the balancer claimer. It does not call upper contracts initializers.
     * @param smartVault Source smart vault address
     */
    function __MigrationClaimer_init_unchained(TaskConfig memory, address smartVault) internal onlyInitializing {
        _setSourceSmartVault(smartVault);
    }

    /**
     * @dev Tells the address from where the token amounts to execute this task are fetched
     */
    function getTokensSource() external view virtual override(IBaseTask, BaseTask) returns (address) {
        return sourceSmartVault;
    }

    /**
     * @dev Tells the token balance in the source smart vault
     * @param token Address of the token being queried
     */
    function getTaskAmount(address token) public view virtual override(IBaseTask, BaseTask) returns (uint256) {
        return ERC20Helpers.balanceOf(token, sourceSmartVault);
    }

    /**
     * @dev Sets the Source smart vault address. Sender must be authorized.
     * @param newSourceSmartVault Address of the Source smart vault to be set
     */
    function setSourceSmartVault(address newSourceSmartVault) external override authP(authParams(newSourceSmartVault)) {
        _setSourceSmartVault(newSourceSmartVault);
    }

    /**
     * @dev Executes the Balancer claimer task
     */
    function call(address token, uint256 amount) external override authP(authParams(token, amount)) {
        if (amount == 0) amount = getTaskAmount(token);
        _beforeMigrationClaimer(token, amount);
        // solhint-disable-next-line avoid-low-level-calls
        ISmartVault(smartVault).call(sourceSmartVault, _buildMigrationClaimerData(token, amount), 0);
        _afterMigrationClaimer(token, amount);
    }

    /**
     * @dev Builds Source smart vault calldata
     */
    function _buildMigrationClaimerData(address token, uint256 amount) internal view returns (bytes memory) {
        return abi.encodeWithSelector(IOldSmartVault.withdraw.selector, token, amount, smartVault, '0x');
    }

    /**
     * @dev Before balancer claimer task hook
     */
    function _beforeMigrationClaimer(address token, uint256 amount) internal {
        _beforeTask(token, amount);
        if (token == address(0)) revert TaskTokenZero();
        if (amount == 0) revert TaskAmountZero();
    }

    /**
     * @dev After balancer claimer task hook
     */
    function _afterMigrationClaimer(address token, uint256 amount) internal {
        _increaseBalanceConnector(token, amount);
        _afterTask(token, amount);
    }

    /**
     * @dev Sets the Source smart vault address
     * @param newSourceSmartVault Address of the Source smart vault to be set
     */
    function _setSourceSmartVault(address newSourceSmartVault) internal {
        if (newSourceSmartVault == address(0)) revert TaskSourceSmartVaultZero();
        sourceSmartVault = newSourceSmartVault;
        emit SourceSmartVaultSet(newSourceSmartVault);
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
