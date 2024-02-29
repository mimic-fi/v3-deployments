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
import '@mimic-fi/v3-helpers/contracts/utils/ERC20Helpers.sol';

import './interfaces/IGMXCodeRegister.sol';
import './interfaces/IReferralStorage.sol';

/**
 * @title GMX code register
 * @dev Task used to register codes on GMX
 */
contract GMXCodeRegister is IGMXCodeRegister, Task {
    // Execution type for relayers
    bytes32 public constant override EXECUTION_TYPE = keccak256('GMX_CODE_REGISTER');

    // Referral storage address
    address public override referralStorage;

    /**
     * @dev Initializes the GMX code register
     * @param config Task config
     * @param _referralStorage Referral storage address
     */
    function initializeGMXCodeRegister(TaskConfig memory config, address _referralStorage)
        external
        virtual
        initializer
    {
        __GMXCodeRegister_init(config, _referralStorage);
    }

    /**
     * @dev Initializes the GMX code register. It does call upper contracts initializers.
     * @param config Task config
     * @param _referralStorage Referral storage address
     */
    function __GMXCodeRegister_init(TaskConfig memory config, address _referralStorage) internal onlyInitializing {
        __Task_init(config);
        __GMXCodeRegister_init_unchained(config, _referralStorage);
    }

    /**
     * @dev Initializes the GMX code register
     * @param _referralStorage Referral storage address
     */
    function __GMXCodeRegister_init_unchained(TaskConfig memory, address _referralStorage) internal onlyInitializing {
        _setReferralStorage(_referralStorage);
    }

    /**
     * @dev Sets the referral storage address. Sender must be authorized.
     * @param newReferralStorage Address of the referral storage to be set
     */
    function setReferralStorage(address newReferralStorage) external override authP(authParams(newReferralStorage)) {
        _setReferralStorage(newReferralStorage);
    }

    /**
     * @dev Executes the GMX code register task
     */
    function call(bytes32 code) external override authP(authParams(code)) {
        _beforeGMXCodeRegister(code);
        bytes memory data = abi.encodeWithSelector(IReferralStorage.registerCode.selector, code);
        // solhint-disable-next-line avoid-low-level-calls
        ISmartVault(smartVault).call(referralStorage, data, 0);
        _afterGMXCodeRegister(code);
    }

    /**
     * @dev Before GMX code register task hook
     */
    function _beforeGMXCodeRegister(bytes32 code) internal virtual {
        _beforeBaseTask(address(0), 0); // token and amount are not used
        if (code == bytes32(0)) revert TaskCodeZero();
    }

    /**
     * @dev After GMX code register task hook
     */
    function _afterGMXCodeRegister(bytes32) internal virtual {
        _afterBaseTask(address(0), 0); // token and amount are not used
    }

    /**
     * @dev Sets the referral storage address
     * @param newReferralStorage Address of the referral storage to be set
     */
    function _setReferralStorage(address newReferralStorage) internal {
        if (newReferralStorage == address(0)) revert TaskReferralStorageZero();
        referralStorage = newReferralStorage;
        emit ReferralStorageSet(newReferralStorage);
    }

    /**
     * @dev Sets the balance connectors. Both balance connectors must be unset.
     * @param previous Balance connector id of the previous task in the workflow
     * @param next Balance connector id of the next task in the workflow
     */
    function _setBalanceConnectors(bytes32 previous, bytes32 next) internal virtual override {
        if (previous != bytes32(0)) revert TaskPreviousConnectorNotZero(previous);
        if (next != bytes32(0)) revert TaskNextConnectorNotZero(next);
        super._setBalanceConnectors(previous, next);
    }
}
