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

interface IGNSMultiCollatDiamond {
    struct ReferrerDetails {
        address ally;
        address[] tradersReferred;
        uint256 volumeReferredUsd;
        uint256 pendingRewardsToken;
        uint256 totalRewardsToken;
        uint256 totalRewardsValueUsd;
        bool active;
    }

    struct Addresses {
        address gns;
    }

    /**
     * @dev Get referrer details
     */
    function getReferrerDetails(address referrer) external view returns (ReferrerDetails memory);

    /**
     * @dev Get addresses related to GNS protocol
     */
    function getAddresses() external view returns (Addresses memory);

    /**
     * @dev Claim referrer rewards
     */
    function claimReferrerRewards() external;
}
