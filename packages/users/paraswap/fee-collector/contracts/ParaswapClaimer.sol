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

import './interfaces/IFeeClaimer.sol';
import './interfaces/IParaswapClaimer.sol';

// solhint-disable avoid-low-level-calls

contract ParaswapClaimer is IParaswapClaimer, Task {
    // Execution type for relayers
    bytes32 public constant override EXECUTION_TYPE = keccak256('PARASWAP_CLAIMER');

    // Fee claimer address
    address public override feeClaimer;

    /**
     * @dev Initializes the paraswap claimer
     * @param config Task config
     * @param claimer Fee claimer address
     */
    function initializeParaswapClaimer(TaskConfig memory config, address claimer) external virtual initializer {
        __ParaswapClaimer_init(config, claimer);
    }

    /**
     * @dev Initializes the Paraswap claimer. It does call upper contracts initializers.
     * @param config Task config
     * @param claimer Fee claimer address
     */
    function __ParaswapClaimer_init(TaskConfig memory config, address claimer) internal onlyInitializing {
        __Task_init(config);
        __ParaswapClaimer_init_unchained(config, claimer);
    }

    /**
     * @dev Initializes the Paraswap claimer. It does not call upper contracts initializers.
     * @param claimer Fee claimer address
     */
    function __ParaswapClaimer_init_unchained(TaskConfig memory, address claimer) internal onlyInitializing {
        _setFeeClaimer(claimer);
    }

    /**
     * @dev Tells the address from where the token amounts to execute this task are fetched
     */
    function getTokensSource() external view virtual override(IBaseTask, BaseTask) returns (address) {
        return feeClaimer;
    }

    /**
     * @dev Tells the token balance in the fee claimer available for the smart vault
     * @param token Address of the token being queried
     */
    function getTaskAmount(address token) public view virtual override(IBaseTask, BaseTask) returns (uint256) {
        return IFeeClaimer(feeClaimer).getBalance(token, address(smartVault));
    }

    /**
     * @dev Sets the fee claimer address. Sender must be authorized.
     * @param newFeeClaimer Address of the fee claimer to be set
     */
    function setFeeClaimer(address newFeeClaimer) external override authP(authParams(newFeeClaimer)) {
        _setFeeClaimer(newFeeClaimer);
    }

    /**
     * @dev Executes the Paraswap claimer task
     */
    function call(address token, uint256 amount) external override authP(authParams(token, amount)) {
        if (amount == 0) amount = getTaskAmount(token);
        _beforeParaswapClaimer(token, amount);

        bytes memory data = abi.encodeWithSelector(IFeeClaimer.withdrawSomeERC20.selector, token, amount, smartVault);
        // solhint-disable-next-line avoid-low-level-calls
        bytes memory response = ISmartVault(smartVault).call(feeClaimer, data, 0);
        if (!abi.decode(response, (bool))) revert TaskClaimFailed();

        _afterParaswapClaimer(token, amount);
    }

    /**
     * @dev Before Paraswap claimer task hook
     */
    function _beforeParaswapClaimer(address token, uint256 amount) internal {
        _beforeTask(token, amount);
        if (token == address(0)) revert TaskTokenZero();
        if (amount == 0) revert TaskAmountZero();
    }

    /**
     * @dev After Paraswap claimer task hook
     */
    function _afterParaswapClaimer(address token, uint256 amount) internal {
        _increaseBalanceConnector(token, amount);
        _afterTask(token, amount);
    }

    /**
     * @dev Sets the fee claimer address
     * @param newFeeClaimer Address of the fee claimer to be set
     */
    function _setFeeClaimer(address newFeeClaimer) internal {
        if (newFeeClaimer == address(0)) revert TaskFeeClaimerZero();
        feeClaimer = newFeeClaimer;
        emit FeeClaimerSet(newFeeClaimer);
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
