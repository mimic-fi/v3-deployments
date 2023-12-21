// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../interfaces/IProtocolFeeWithdrawer.sol';

contract ProtocolFeeWithdrawerMock is IProtocolFeeWithdrawer {
    using SafeERC20 for IERC20;

    // Protocol fees collector address
    address public protocolFeesCollector;

    constructor(address _protocolFeesCollector) {
        protocolFeesCollector = _protocolFeesCollector;
    }

    function withdrawCollectedFees(address[] calldata tokens, uint256[] calldata amounts, address recipient)
        external
        override
    {
        require(tokens.length == amounts.length, 'WITHDRAWER_INVALID_INPUT_LEN');
        for (uint256 i = 0; i < tokens.length; i++) {
            require(IERC20(tokens[i]).balanceOf(protocolFeesCollector) >= amounts[i], 'INVALID_WITHDRAWER_BALANCE');
            IERC20(tokens[i]).safeTransferFrom(protocolFeesCollector, recipient, amounts[i]);
        }
    }
}
