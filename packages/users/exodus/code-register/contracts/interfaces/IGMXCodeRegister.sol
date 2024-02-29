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
 * @title GMX code register interface
 */
interface IGMXCodeRegister is ITask {
    /**
     * @dev The code is zero
     */
    error TaskCodeZero();

    /**
     * @dev The referral storage is zero
     */
    error TaskReferralStorageZero();

    /**
     * @dev The previous balance connector is not zero
     */
    error TaskPreviousConnectorNotZero(bytes32 id);

    /**
     * @dev The next balance connector is not zero
     */
    error TaskNextConnectorNotZero(bytes32 id);

    /**
     * @dev Emitted every time the referral storage is set
     */
    event ReferralStorageSet(address indexed referralStorage);

    /**
     * @dev Tells the referral storage address
     */
    function referralStorage() external view returns (address);

    /**
     * @dev Sets the referral storage address. Sender must be authorized.
     * @param newReferralStorage Address of the referral storage to be set
     */
    function setReferralStorage(address newReferralStorage) external;

    /**
     * @dev Executes the GMX code register task
     */
    function call(bytes32 code) external;
}
