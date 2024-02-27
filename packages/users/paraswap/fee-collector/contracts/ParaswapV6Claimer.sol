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

import './interfaces/v6/IParaswapV6Claimer.sol';
import './interfaces/v6/IAugustusV6FeeVault.sol';

// solhint-disable avoid-low-level-calls

contract ParaswapV6Claimer is IParaswapV6Claimer, Task {
    // Execution type for relayers
    bytes32 public constant override EXECUTION_TYPE = keccak256('PARASWAP_V6_CLAIMER');

    // Augustus fee vault address
    address public override feeVault;

    /**
     * @dev Initializes the Paraswap v6 claimer
     * @param config Task config
     * @param vault Augustus fee vault address
     */
    function initializeParaswapV6Claimer(TaskConfig memory config, address vault) external virtual initializer {
        __ParaswapV6Claimer_init(config, vault);
    }

    /**
     * @dev Initializes the Paraswap v6 claimer. It does call upper contracts initializers.
     * @param config Task config
     * @param vault Augustus fee vault address
     */
    function __ParaswapV6Claimer_init(TaskConfig memory config, address vault) internal onlyInitializing {
        __Task_init(config);
        __ParaswapV6Claimer_init_unchained(config, vault);
    }

    /**
     * @dev Initializes the Paraswap v6 claimer. It does not call upper contracts initializers.
     * @param vault Augustus fee vault address
     */
    function __ParaswapV6Claimer_init_unchained(TaskConfig memory, address vault) internal onlyInitializing {
        _setFeeVault(vault);
    }

    /**
     * @dev Tells the address from where the token amounts to execute this task are fetched
     */
    function getTokensSource() external view virtual override(IBaseTask, BaseTask) returns (address) {
        return feeVault;
    }

    /**
     * @dev Tells the token balance in the Augustus fee vault available for the smart vault
     * @param token Address of the token being queried
     */
    function getTaskAmount(address token) public view virtual override(IBaseTask, BaseTask) returns (uint256) {
        return IAugustusV6FeeVault(feeVault).getBalance(token, address(smartVault));
    }

    /**
     * @dev Sets the Augustus fee vault address. Sender must be authorized.
     * @param newFeeVault Address of the Augustus fee vault to be set
     */
    function setFeeVault(address newFeeVault) external override authP(authParams(newFeeVault)) {
        _setFeeVault(newFeeVault);
    }

    /**
     * @dev Executes the Paraswap V6 claimer task
     */
    function call(address token, uint256 amount) external override authP(authParams(token, amount)) {
        if (amount == 0) amount = getTaskAmount(token);
        _beforeParaswapV6Claimer(token, amount);

        // solhint-disable-next-line avoid-low-level-calls
        bytes memory response = ISmartVault(smartVault).call(
            feeVault,
            abi.encodeWithSelector(IAugustusV6FeeVault.collect.selector, token, amount, smartVault, smartVault),
            0
        );
        if (!abi.decode(response, (bool))) revert TaskClaimFailed();

        _afterParaswapV6Claimer(token, amount);
    }

    /**
     * @dev Before Paraswap v6 claimer task hook
     */
    function _beforeParaswapV6Claimer(address token, uint256 amount) internal {
        _beforeTask(token, amount);
        if (token == address(0)) revert TaskTokenZero();
        if (amount == 0) revert TaskAmountZero();
    }

    /**
     * @dev After Paraswap v6 claimer task hook
     */
    function _afterParaswapV6Claimer(address token, uint256 amount) internal {
        _increaseBalanceConnector(token, amount);
        _afterTask(token, amount);
    }

    /**
     * @dev Sets the Augustus fee vault address
     * @param newFeeVault Address of the Augustus fee vault to be set
     */
    function _setFeeVault(address newFeeVault) internal {
        if (newFeeVault == address(0)) revert TaskFeeVaultZero();
        feeVault = newFeeVault;
        emit FeeVaultSet(newFeeVault);
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
