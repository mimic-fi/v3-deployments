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

import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

import '@mimic-fi/v3-tasks/contracts/Task.sol';
import './interfaces/IOffChainSignedWithdrawer.sol';

/**
 * @title Off-chain signed withdrawer
 * @dev Task that offers a withdraw functionality authorized by a trusted external account
 */
contract OffChainSignedWithdrawer is Task, IOffChainSignedWithdrawer {
    // Execution type for relayers
    bytes32 public constant override EXECUTION_TYPE = keccak256('OFF_CHAIN_SIGNED_WITHDRAWER');

    // Address signing the withdraw information
    address public override signer;

    /**
     * @dev Off-chain signed withdraw config. Only used in the initializer.
     */
    struct OffChainSignedWithdrawerConfig {
        address signer;
        TaskConfig taskConfig;
    }

    /**
     * @dev Initializes the off-chain signed withdrawer
     * @param config Off-chain signed withdraw config
     */
    function initialize(OffChainSignedWithdrawerConfig memory config) external virtual initializer {
        __OffChainSignedWithdrawer_init(config);
    }

    /**
     * @dev Initializes the off-chain signed withdrawer. It does call upper contracts initializers.
     * @param config Off-chain signed withdraw config
     */
    function __OffChainSignedWithdrawer_init(OffChainSignedWithdrawerConfig memory config) internal onlyInitializing {
        __Task_init(config.taskConfig);
        __OffChainSignedWithdrawer_init_unchained(config);
    }

    /**
     * @dev Initializes the off-chain signed withdrawer. It does not call upper contracts initializers.
     * @param config Off-chain signed withdraw config
     */
    function __OffChainSignedWithdrawer_init_unchained(OffChainSignedWithdrawerConfig memory config)
        internal
        onlyInitializing
    {
        _setSigner(config.signer);
    }

    /**
     * @dev Sets the signer address. Sender must be authorized.
     * @param newSigner Address of the new signer to be set
     */
    function setSigner(address newSigner) external override authP(authParams(newSigner)) {
        _setSigner(newSigner);
    }

    /**
     * @dev Executes the Withdrawer
     */
    function call(address token, uint256 amount, address recipient, bytes memory signature)
        external
        override
        authP(authParams(token, amount))
    {
        if (amount == 0) amount = getTaskAmount(token);
        _beforeOffChainSignedWithdrawer(token, amount, recipient, signature);
        ISmartVault(smartVault).withdraw(token, recipient, amount);
        _afterOffChainSignedWithdrawer(token, amount, recipient, signature);
    }

    /**
     * @dev Before off-chain signed withdrawer hook
     */
    function _beforeOffChainSignedWithdrawer(address token, uint256 amount, address recipient, bytes memory signature)
        internal
        virtual
    {
        _beforeTask(token, amount);
        if (token == address(0)) revert TaskTokenZero();
        if (amount == 0) revert TaskAmountZero();
        if (recipient == address(0)) revert TaskRecipientZero();
        bytes32 message = keccak256(abi.encodePacked(token, amount, recipient));
        address recoveredSigner = ECDSA.recover(ECDSA.toEthSignedMessageHash(message), signature);
        if (signer != recoveredSigner) revert TaskInvalidOffChainSignedWithdrawer(recoveredSigner, signer);
    }

    /**
     * @dev After off-chain signed withdrawer hook
     */
    function _afterOffChainSignedWithdrawer(address token, uint256 amount, address recipient, bytes memory signature)
        internal
        virtual
    {
        _afterTask(token, amount);
    }

    /**
     * @dev Sets the signer address
     * @param newSigner Address of the new signer to be set
     */
    function _setSigner(address newSigner) internal {
        if (newSigner == address(0)) revert TaskSignerZero();
        signer = newSigner;
        emit SignerSet(newSigner);
    }

    /**
     * @dev Sets the balance connectors. Next balance connector must be unset.
     * @param previous Balance connector id of the previous task in the workflow
     * @param next Balance connector id of the next task in the workflow
     */
    function _setBalanceConnectors(bytes32 previous, bytes32 next) internal virtual override {
        if (next != bytes32(0)) revert TaskNextConnectorNotZero(next);
        super._setBalanceConnectors(previous, next);
    }
}
