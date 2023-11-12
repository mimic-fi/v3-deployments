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

import './DexMock.sol';

contract OneInchV5ConnectorMock {
    DexMock public immutable dex;

    constructor() {
        dex = new DexMock();
    }

    function mockRate(uint256 newRate) external {
        dex.mockRate(newRate);
    }

    function execute(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, bytes memory data)
        external
        returns (uint256)
    {
        IERC20(tokenIn).approve(address(dex), amountIn);
        return dex.swap(tokenIn, tokenOut, amountIn, minAmountOut, data);
    }
}
