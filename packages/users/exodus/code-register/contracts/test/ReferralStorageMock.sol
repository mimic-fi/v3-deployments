// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '../interfaces/IReferralStorage.sol';

contract ReferralStorageMock is IReferralStorage {
    event CodeRegistered(bytes32 code);

    mapping (bytes32 => address) public codeOwners;

    function registerCode(bytes32 code) external override {
        codeOwners[code] = msg.sender;
        emit CodeRegistered(code);
    }
}
