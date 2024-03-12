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
 * @title GMX rewards claimer interface
 */
interface IGMXRewardsClaimer is ITask {
    /**
     * @dev The token is zero
     */
    error TaskTokenZero();

    /**
     * @dev The amount is not zero
     */
    error TaskAmountNotZero();

    /**
     * @dev The markets array is empty
     */
    error TaskMarketsEmpty();

    /**
     * @dev The GMX exchange router address is zero
     */
    error TaskGmxExchangeRouterZero();

    /**
     * @dev The market is zero
     */
    error TaskMarketZero(uint256 index);

    /**
     * @dev The previous balance connector is not zero
     */
    error TaskPreviousConnectorNotZero(bytes32 id);

    /**
     * @dev Emitted every time the GMX exchange router address is set
     */
    event GmxExchangeRouterSet(address indexed gmxExchangeRouter);

    /**
     * @dev Tells the GMX exchange router address
     */
    function gmxExchangeRouter() external view returns (address);

    /**
     * @dev Sets the GMX exchange router address. Sender must be authorized.
     * @param newGmxExchangeRouter Address of the GMX exchange router to be set
     */
    function setGmxExchangeRouter(address newGmxExchangeRouter) external;

    /**
     * @dev Executes the GMX rewards claimer task
     * @param token Address of the token to claim rewards for
     * @param amount Must be zero, it is not possible to claim a specific number of tokens
     * @param markets Addresses of the markets to claim rewards for
     */
    function call(address token, uint256 amount, address[] memory markets) external;
}
