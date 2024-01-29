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
import '@mimic-fi/v3-helpers/contracts/utils/Denominations.sol';

import './interfaces/IRainbowClaimer.sol';
import './interfaces/IFeeCollector.sol';

/**
 * @title Rainbow claimer
 * @dev Task used to claim tokens from Rainbow's fee collector
 */
contract RainbowClaimer is IRainbowClaimer, Task {
    // Execution type for relayers
    bytes32 public constant override EXECUTION_TYPE = keccak256('RAINBOW_CLAIMER');

    // Fee collector address
    address public override feeCollector;

    // Safe address
    address public override safe;

    /**
     * @dev Initializes the Rainbow claimer
     * @param config Task config
     * @param collector Fee collector address
     * @param _safe Safe address
     */
    function initializeRainbowClaimer(TaskConfig memory config, address collector, address _safe)
        external
        virtual
        initializer
    {
        __RainbowClaimer_init(config, collector, _safe);
    }

    /**
     * @dev Initializes the Rainbow claimer. It does call upper contracts initializers.
     * @param config Task config
     * @param collector Fee collector address
     * @param _safe Safe address
     */
    function __RainbowClaimer_init(TaskConfig memory config, address collector, address _safe)
        internal
        onlyInitializing
    {
        __Task_init(config);
        __RainbowClaimer_init_unchained(config, collector, _safe);
    }

    /**
     * @dev Initializes the Rainbow claimer. It does not call upper contracts initializers.
     * @param collector Fee collector address
     * @param _safe Safe address
     */
    function __RainbowClaimer_init_unchained(TaskConfig memory, address collector, address _safe)
        internal
        onlyInitializing
    {
        _setFeeCollector(collector);
        _setSafe(_safe);
    }

    /**
     * @dev Tells the address from where the token amounts to execute this task are fetched
     */
    function getTokensSource() external view virtual override(IBaseTask, BaseTask) returns (address) {
        return safe;
    }

    /**
     * @dev Tells the token balance in the fee collector
     * @param token Address of the token being queried
     */
    function getTaskAmount(address token) public view virtual override(IBaseTask, BaseTask) returns (uint256) {
        return ERC20Helpers.balanceOf(token, safe);
    }

    /**
     * @dev Sets the fee collector address. Sender must be authorized.
     * @param newFeeCollector Address of the fee collector to be set
     */
    function setFeeCollector(address newFeeCollector) external override authP(authParams(newFeeCollector)) {
        _setFeeCollector(newFeeCollector);
    }

    /**
     * @dev Sets the safe address. Sender must be authorized.
     * @param newSafe Address of the safe to be set
     */
    function setSafe(address newSafe) external override authP(authParams(newSafe)) {
        _setSafe(newSafe);
    }

    /**
     * @dev Executes the Rainbow claimer task
     */
    function call(address token, uint256 amount) external override authP(authParams(token, amount)) {
        if (amount == 0) amount = getTaskAmount(token);
        _beforeRainbowClaimer(token, amount);
        // solhint-disable-next-line avoid-low-level-calls
        ISmartVault(smartVault).call(feeCollector, _buildRainbowClaimerData(token, amount), 0);
        _afterRainbowClaimer(token, amount);
    }

    /**
     * @dev Builds fee collector calldata
     */
    function _buildRainbowClaimerData(address token, uint256 amount) internal pure returns (bytes memory) {
        return
            Denominations.isNativeToken(token)
                ? abi.encodeWithSelector(IFeeCollector.collectETHFees.selector, amount)
                : abi.encodeWithSelector(IFeeCollector.collectTokenFees.selector, token, amount);
    }

    /**
     * @dev Before Rainbow claimer task hook
     */
    function _beforeRainbowClaimer(address token, uint256 amount) internal {
        _beforeTask(token, amount);
        if (token == address(0)) revert TaskTokenZero();
        if (amount == 0) revert TaskAmountZero();
    }

    /**
     * @dev After Rainbow claimer task hook
     */
    function _afterRainbowClaimer(address token, uint256 amount) internal {
        _increaseBalanceConnector(token, amount);
        _afterTask(token, amount);
    }

    /**
     * @dev Sets the fee collector address
     * @param newFeeCollector Address of the fee collector to be set
     */
    function _setFeeCollector(address newFeeCollector) internal {
        if (newFeeCollector == address(0)) revert TaskFeeCollectorZero();
        feeCollector = newFeeCollector;
        emit FeeCollectorSet(newFeeCollector);
    }

    /**
     * @dev Sets the safe address
     * @param newSafe Address of the safe to be set
     */
    function _setSafe(address newSafe) internal {
        if (newSafe == address(0)) revert TaskSafeZero();
        safe = newSafe;
        emit SafeSet(newSafe);
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
