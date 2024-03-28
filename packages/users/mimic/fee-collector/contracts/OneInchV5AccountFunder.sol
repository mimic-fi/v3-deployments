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

import '@mimic-fi/v3-tasks/contracts/swap/OneInchV5Swapper.sol';

import './interfaces/IOneInchV5AccountFunder.sol';

/**
 * @title 1inch v5 account funder
 * @dev Task used to convert funds in order to fund an external account using a 1inch v5 swapper
 */
contract OneInchV5AccountFunder is IOneInchV5AccountFunder, OneInchV5Swapper {
    using FixedPoint for uint256;

    // Reference to the contract to be funded
    address public override account;

    /**
     * @dev Disables the default 1inch v5 account funder initializer
     */
    function initialize(OneInchV5SwapConfig memory) external pure override {
        revert TaskInitializerDisabled();
    }

    /**
     * @dev Initializes the 1inch v5 account funder
     * @param config 1inch v5 swap config
     * @param _account Account address
     */
    function initializeOneInchV5AccountFunder(OneInchV5SwapConfig memory config, address _account)
        external
        virtual
        initializer
    {
        __OneInchV5AccountFunder_init(config, _account);
    }

    /**
     * @dev Initializes the 1inch v5 account funder. It does call upper contracts initializers.
     * @param config 1inch v5 swap config
     * @param _account Account address
     */
    function __OneInchV5AccountFunder_init(OneInchV5SwapConfig memory config, address _account)
        internal
        onlyInitializing
    {
        __OneInchV5Swapper_init(config);
        __OneInchV5AccountFunder_init_unchained(config, _account);
    }

    /**
     * @dev Initializes the 1inch v5 account funder. It does not call upper contracts initializers.
     * @param _account Account address
     */
    function __OneInchV5AccountFunder_init_unchained(OneInchV5SwapConfig memory, address _account)
        internal
        onlyInitializing
    {
        _setAccount(_account);
    }

    /**
     * @dev Tells the amount in `token` to be transferred to the account
     * @param token Address of the token to be used to transfer the account
     */
    function getTaskAmount(address token) public view virtual override(IBaseTask, BaseTask) returns (uint256) {
        Threshold memory threshold = _getTokenThreshold(token);
        if (threshold.token == address(0)) return 0;

        uint256 balanceInThresholdToken = _getAccountBalanceInThresholdToken(threshold.token);
        if (balanceInThresholdToken >= threshold.min) return 0;

        uint256 diff = threshold.max - balanceInThresholdToken;
        return (token == threshold.token) ? diff : diff.mulUp(_getPrice(threshold.token, token));
    }

    /**
     * @dev Sets the account
     * @param newAccount Address of the account to be set
     */
    function setAccount(address newAccount) external override authP(authParams(newAccount)) {
        _setAccount(newAccount);
    }

    /**
     * @dev Before token threshold task hook
     */
    function _beforeTokenThresholdTask(address token, uint256 amount) internal virtual override {
        Threshold memory threshold = _getTokenThreshold(token);
        if (threshold.token == address(0)) revert TaskTokenThresholdNotSet(token);

        uint256 balanceInThresholdToken = _getAccountBalanceInThresholdToken(threshold.token);
        bool isBalanceAboveMin = balanceInThresholdToken >= threshold.min;
        if (isBalanceAboveMin) revert TaskBalanceAboveMinThreshold(balanceInThresholdToken, threshold.min);

        uint256 amountInThresholdToken = amount.mulUp(_getPrice(token, threshold.token));
        uint256 afterBalanceInThresholdToken = amountInThresholdToken + balanceInThresholdToken;
        bool isNewBalanceBelowMin = afterBalanceInThresholdToken < threshold.min;
        if (isNewBalanceBelowMin) revert TaskNewBalanceBelowMinThreshold(afterBalanceInThresholdToken, threshold.min);

        bool isNewBalanceAboveMax = afterBalanceInThresholdToken > threshold.max;
        if (isNewBalanceAboveMax) revert TaskNewBalanceAboveMaxThreshold(afterBalanceInThresholdToken, threshold.max);
    }

    /**
     * @dev Tells the account balance expressed in another token
     */
    function _getAccountBalanceInThresholdToken(address token) internal view returns (uint256) {
        uint256 nativeTokenBalance = address(account).balance;
        return nativeTokenBalance.mulUp(_getPrice(_wrappedNativeToken(), token));
    }

    /**
     * @dev Sets the account address
     * @param newAccount Address of the account to be set
     */
    function _setAccount(address newAccount) internal {
        if (newAccount == address(0)) revert TaskAccountZero();
        account = newAccount;
        emit AccountSet(newAccount);
    }
}
