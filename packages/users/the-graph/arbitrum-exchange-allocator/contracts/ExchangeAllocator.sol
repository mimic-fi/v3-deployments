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

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import '@mimic-fi/v3-tasks/contracts/primitives/Collector.sol';

import './interfaces/IExchangeAllocator.sol';

/**
 * @title Exchange allocator
 * @dev Task used to pay The Graph's allocation exchange recurring subscriptions
 */
contract ExchangeAllocator is IExchangeAllocator, Collector {
    using FixedPoint for uint256;

    address public override allocationExchange;

    /**
     * @dev Disables the default collector initializer
     */
    function initialize(CollectConfig memory) external pure override {
        revert('COLLECTOR_INITIALIZER_DISABLED');
    }

    /**
     * @dev Initializes the exchange allocator
     * @param config Collect config
     * @param exchange Allocation exchange address
     */
    function initializeExchangeAllocator(CollectConfig memory config, address exchange) external virtual initializer {
        __ExchangeAllocator_init(config, exchange);
    }

    /**
     * @dev Initializes the exchange allocator. It does call upper contracts initializers.
     * @param config Exchange allocator config
     * @param exchange Allocation exchange address
     */
    function __ExchangeAllocator_init(CollectConfig memory config, address exchange) internal onlyInitializing {
        __Collector_init(config);
        __ExchangeAllocator_init_unchained(config, exchange);
    }

    /**
     * @dev Initializes the exchange allocator. It does not call upper contracts initializers.
     * @param exchange Allocation exchange address
     */
    function __ExchangeAllocator_init_unchained(CollectConfig memory, address exchange) internal onlyInitializing {
        _setAllocationExchange(exchange);
    }

    /**
     * @dev Sets the allocation exchange address. Sender must be authorized.
     * @param newAllocationExchange Address of the allocation exchange to be set
     */
    function setAllocationExchange(address newAllocationExchange)
        external
        override
        authP(authParams(newAllocationExchange))
    {
        _setAllocationExchange(newAllocationExchange);
    }

    /**
     * @dev Tells the amount in `token` to be funded
     * @param token Address of the token to be used for funding
     */
    function getTaskAmount(address token) public view virtual override(IBaseTask, BaseTask) returns (uint256) {
        Threshold memory threshold = TokenThresholdTask.getTokenThreshold(token);
        uint256 price = _getPrice(threshold.token, token);
        uint256 currentBalance = IERC20(token).balanceOf(allocationExchange);
        uint256 minThresholdInToken = threshold.min.mulUp(price);
        if (currentBalance >= minThresholdInToken) return 0;

        uint256 maxThresholdInToken = threshold.max.mulUp(price);
        return maxThresholdInToken - currentBalance;
    }

    /**
     * @dev Before token threshold task hook
     */
    function _beforeTokenThresholdTask(address token, uint256 amount) internal virtual override {
        Threshold memory threshold = TokenThresholdTask.getTokenThreshold(token);
        uint256 price = _getPrice(threshold.token, token);
        uint256 currentBalance = IERC20(token).balanceOf(allocationExchange);
        require(currentBalance < threshold.min.mulUp(price), 'TASK_TOKEN_THRESHOLD_NOT_MET');
        require(currentBalance + amount <= threshold.max.mulUp(price), 'TASK_TOKEN_THRESHOLD_NOT_MET');
    }

    /**
     * @dev Sets the allocation exchange address
     * @param newAllocationExchange Address of the allocation exchange to be set
     */
    function _setAllocationExchange(address newAllocationExchange) internal {
        require(newAllocationExchange != address(0), 'TASK_ALLOCATION_EXCHANGE_ZERO');
        allocationExchange = newAllocationExchange;
        emit AllocationExchangeSet(newAllocationExchange);
    }
}
