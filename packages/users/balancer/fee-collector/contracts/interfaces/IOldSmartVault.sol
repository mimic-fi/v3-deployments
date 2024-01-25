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

interface IOldSmartVault {
    /**
     * @dev Withdraw tokens to an external account
     * @param token Address of the token to be withdrawn
     * @param amount Amount of tokens to withdraw
     * @param recipient Address where the tokens will be transferred to
     * @param data Extra data that may enable or not different behaviors depending on the implementation
     * @return withdrawn Amount of tokens transferred to the recipient address
     */
    function withdraw(address token, uint256 amount, address recipient, bytes memory data)
        external
        returns (uint256 withdrawn);
}
