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

import '@mimic-fi/v3-helpers/contracts/utils/BytesHelpers.sol';
import '@mimic-fi/v3-connectors/contracts/interfaces/swap/IOneInchV5Connector.sol';

import './BasePublicSwapTask.sol';

/**
 * @title 1inch v5 public swapper
 * @dev Task that extends the base public swap task to use 1inch v5
 */
contract OneInchV5PublicSwapper is BasePublicSwapTask {
    using BytesHelpers for bytes;

    // Execution type for relayers
    bytes32 public constant override EXECUTION_TYPE = keccak256('1INCH_V5_PUBLIC_SWAPPER');

    /**
     * @dev Swaps two tokens
     * @param tokenIn Token being sent
     * @param tokenOut Token being received
     * @param amountIn Amount of tokenIn being swapped
     * @param minAmountOut Minimum amount of tokenOut expected to be received
     * @param data Extra data that may enable or not different behaviors depending on the source picked
     */
    function call(address tokenIn, uint256 amountIn, address tokenOut, uint256 minAmountOut, bytes memory data)
        external
        payable
        authP(authParams(tokenIn, tokenOut))
    {
        _beforePublicSwapper(tokenIn, amountIn, tokenOut, minAmountOut);

        // Note that the swap should only be executed if this is not actually a wrap/unwrap only action
        // In that case, the scenario is already covered by the before and after hooks
        uint256 amountOut;
        address swapTokenIn = _wrappedIfNative(tokenIn);
        address swapTokenOut = _wrappedIfNative(tokenOut);
        if (swapTokenIn == swapTokenOut) {
            amountOut = amountIn;
        } else {
            bytes memory connectorData = abi.encodeWithSelector(
                IOneInchV5Connector.execute.selector,
                swapTokenIn,
                swapTokenOut,
                amountIn,
                minAmountOut,
                data
            );
            bytes memory result = ISmartVault(smartVault).execute(connector, connectorData);
            amountOut = result.toUint256();
        }

        _afterPublicSwapper(tokenIn, amountIn, tokenOut, amountOut, minAmountOut);
    }
}
