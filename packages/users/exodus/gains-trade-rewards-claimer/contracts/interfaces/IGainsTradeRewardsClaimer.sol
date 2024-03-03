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
 * @title GainsTrade rewards claimer interface
 */
interface IGainsTradeRewardsClaimer is ITask {
    /**
     * @dev The amount is not zero
     */
    error TaskAmountNotZero();

    /**
     * @dev The GNS contract address is zero
     */
    error TaskGnsMultiCollatDiamondZero();

    /**
     * @dev The token is not the GNS token
     */
    error TaskTokenNotGns(address actual, address expected);

    /**
     * @dev The previous balance connector is not zero
     */
    error TaskPreviousConnectorNotZero(bytes32 id);

    /**
     * @dev Emitted every time the GNS contract address is set
     */
    event GnsMultiCollatDiamondSet(address indexed gnsMultiCollatDiamond);

    /**
     * @dev Tells the GNS multi collat diamond address
     */
    function gnsMultiCollatDiamond() external view returns (address);

    /**
     * @dev Sets the GNS multi collat diamond address. Sender must be authorized.
     * @param newGnsMultiCollatDiamond Address of the GNS contract to be set
     */
    function setGnsMultiCollatDiamond(address newGnsMultiCollatDiamond) external;

    /**
     * @dev Executes the GainsTrade rewards claimer task
     * @param token Address of the token to claim rewards for
     * @param amount Must be zero, it is not possible to claim a specific number of tokens
     */
    function call(address token, uint256 amount) external;
}
