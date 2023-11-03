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

pragma solidity ^0.8.17;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/Address.sol';

import '@mimic-fi/v3-tasks/contracts/Task.sol';
import '@mimic-fi/v3-helpers/contracts/utils/Denominations.sol';

import './interfaces/IBasePublicSwapTask.sol';

/**
 * @title Base public swap task
 * @dev Task that offers the basic components for more detailed public swap tasks
 */
abstract contract BasePublicSwapTask is IBasePublicSwapTask, Task {
    using Address for address payable;

    // Connector address
    address public override connector;

    /**
     * @dev Initializes the public swapper
     * @param taskConfig Task config
     * @param initialConnector Connector address to be set
     */
    function initializePublicSwapper(TaskConfig memory taskConfig, address initialConnector) external initializer {
        __PublicSwapper_init(taskConfig, initialConnector);
    }

    /**
     * @dev Initializes the public swapper. It does call upper contracts initializers.
     * @param taskConfig Task config
     * @param initialConnector Connector address to be set
     */
    function __PublicSwapper_init(TaskConfig memory taskConfig, address initialConnector) internal onlyInitializing {
        __Task_init(taskConfig);
        __PublicSwapper_init_unchained(taskConfig, initialConnector);
    }

    /**
     * @dev Initializes the public swapper. It does not call upper contracts initializers.
     * @param initialConnector Connector address to be set
     */
    function __PublicSwapper_init_unchained(TaskConfig memory, address initialConnector) internal onlyInitializing {
        _setConnector(initialConnector);
    }

    /**
     * @dev It allows receiving native token transfers
     */
    receive() external payable {
        // solhint-disable-previous-line no-empty-blocks
    }

    /**
     * @dev Sets a new connector
     * @param newConnector Address of the connector to be set
     */
    function setConnector(address newConnector) external override authP(authParams(newConnector)) {
        _setConnector(newConnector);
    }

    /**
     * @dev Before public swapper hook
     */
    function _beforePublicSwapper(address tokenIn, uint256 amountIn, address tokenOut, uint256 minAmountOut)
        internal
        virtual
    {
        _beforeTask(tokenIn, amountIn);
        if (tokenIn == tokenOut) revert SwapSameTokens();
        if (tokenIn == address(0)) revert SwapTokenInZero();
        if (tokenOut == address(0)) revert SwapTokenOutZero();
        if (amountIn == 0) revert SwapAmountInZero();
        if (minAmountOut == 0) revert SwapMinAmountOutZero();

        // Swap amount in is either the wrapped amount in case token in is the native token,
        // or the amount collected by the smart vault in case it is another ERC20 token
        if (Denominations.isNativeToken(tokenIn)) {
            if (msg.value != amountIn) revert SwapUnexpectedMsgValue(msg.value, amountIn);
            payable(smartVault).sendValue(amountIn);
            ISmartVault(smartVault).wrap(amountIn);
        } else {
            if (msg.value != 0) revert SwapUnexpectedMsgValue(msg.value, 0);
            uint256 allowance = IERC20(tokenIn).allowance(msg.sender, smartVault);
            if (allowance < amountIn) revert SwapNotEnoughAllowance(allowance, amountIn);
            ISmartVault(smartVault).collect(tokenIn, msg.sender, amountIn);
        }
    }

    /**
     * @dev After public swapper hook
     */
    function _afterPublicSwapper(
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 amountOut,
        uint256 minAmountOut
    ) internal virtual {
        if (amountOut < minAmountOut) revert SwapMinAmountOut(amountOut, minAmountOut);

        // Finally unwrap if necessary and withdraw token out as requested to the sender
        if (Denominations.isNativeToken(tokenOut)) ISmartVault(smartVault).unwrap(amountOut);
        ISmartVault(smartVault).withdraw(tokenOut, msg.sender, amountOut);

        _afterTask(tokenIn, amountIn);
    }

    /**
     * @dev Sets a new connector
     * @param newConnector Address of the connector to be set
     */
    function _setConnector(address newConnector) internal {
        if (newConnector == address(0)) revert SwapConnectorZero();
        connector = newConnector;
        emit ConnectorSet(newConnector);
    }

    /**
     * @dev Sets the balance connectors. Both balance connectors must be unset.
     * @param previous Balance connector id of the previous task in the workflow
     * @param next Balance connector id of the next task in the workflow
     */
    function _setBalanceConnectors(bytes32 previous, bytes32 next) internal virtual override {
        if (previous != bytes32(0)) revert SwapPreviousConnectorNotZero(previous);
        if (next != bytes32(0)) revert SwapNextConnectorNotZero(next);
        super._setBalanceConnectors(previous, next);
    }
}
