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

import './interfaces/IBalancerClaimer.sol';
import './interfaces/IProtocolFeeWithdrawer.sol';

/**
 * @title Balancer claimer
 * @dev Task used to claim tokens from Balancer's protocol fee withdrawer
 */
contract BalancerClaimer is IBalancerClaimer, Task {
    // Execution type for relayers
    bytes32 public constant override EXECUTION_TYPE = keccak256('BALANCER_CLAIMER');

    // Protocol fee withdrawer address
    address public override protocolFeeWithdrawer;

    // Protocol fees collector address
    address public override protocolFeesCollector;

    /**
     * @dev Initializes the balancer claimer
     * @param config Task config
     * @param withdrawer Protocol fee withdrawer address
     */
    function initializeBalancerClaimer(TaskConfig memory config, address withdrawer, address collector)
        external
        virtual
        initializer
    {
        __BalancerClaimer_init(config, withdrawer, collector);
    }

    /**
     * @dev Initializes the balancer claimer. It does call upper contracts initializers.
     * @param config Task config
     * @param withdrawer Protocol fee withdrawer address
     */
    function __BalancerClaimer_init(TaskConfig memory config, address withdrawer, address collector)
        internal
        onlyInitializing
    {
        __Task_init(config);
        __BalancerClaimer_init_unchained(config, withdrawer, collector);
    }

    /**
     * @dev Initializes the balancer claimer. It does not call upper contracts initializers.
     * @param withdrawer Protocol fee withdrawer address
     */
    function __BalancerClaimer_init_unchained(TaskConfig memory, address withdrawer, address collector)
        internal
        onlyInitializing
    {
        _setProtocolFeeWithdrawer(withdrawer);
        _setProtocolFeesCollector(collector);
    }

    /**
     * @dev Tells the address from where the token amounts to execute this task are fetched
     */
    function getTokensSource() external view virtual override(IBaseTask, BaseTask) returns (address) {
        return protocolFeesCollector;
    }

    /**
     * @dev Tells the token balance in the protocol fees collector available for the smart vault
     * @param token Address of the token being queried
     */
    function getTaskAmount(address token) public view virtual override(IBaseTask, BaseTask) returns (uint256) {
        return ERC20Helpers.balanceOf(token, protocolFeesCollector);
    }

    /**
     * @dev Sets the protocol fee withdrawer address. Sender must be authorized.
     * @param newProtocolFeeWithdrawer Address of the protocol fee withdrawer to be set
     */
    function setProtocolFeeWithdrawer(address newProtocolFeeWithdrawer)
        external
        override
        authP(authParams(newProtocolFeeWithdrawer))
    {
        _setProtocolFeeWithdrawer(newProtocolFeeWithdrawer);
    }

    /**
     * @dev Sets the protocol fees collector address. Sender must be authorized.
     * @param newProtocolFeesCollector Address of the protocol fees collector to be set
     */
    function setProtocolFeesCollector(address newProtocolFeesCollector)
        external
        override
        authP(authParams(newProtocolFeesCollector))
    {
        _setProtocolFeesCollector(newProtocolFeesCollector);
    }

    /**
     * @dev Executes the Balancer claimer task
     */
    function call(address token, uint256 amount) external override authP(authParams(token, amount)) {
        if (amount == 0) amount = getTaskAmount(token);
        _beforeBalancerClaimer(token, amount);
        // solhint-disable-next-line avoid-low-level-calls
        ISmartVault(smartVault).call(protocolFeeWithdrawer, _buildBalancerClaimerData(token, amount), 0);
        _afterBalancerClaimer(token, amount);
    }

    /**
     * @dev Builds protocol fee withdrawer calldata
     */
    function _buildBalancerClaimerData(address token, uint256 amount) internal view returns (bytes memory) {
        address[] memory tokens = new address[](1);
        tokens[0] = token;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        return
            abi.encodeWithSelector(IProtocolFeeWithdrawer.withdrawCollectedFees.selector, tokens, amounts, smartVault);
    }

    /**
     * @dev Before balancer claimer task hook
     */
    function _beforeBalancerClaimer(address token, uint256 amount) internal virtual {
        _beforeTask(token, amount);
        if (token == address(0)) revert TaskTokenZero();
        if (amount == 0) revert TaskAmountZero();
    }

    /**
     * @dev After balancer claimer task hook
     */
    function _afterBalancerClaimer(address token, uint256 amount) internal virtual {
        _increaseBalanceConnector(token, amount);
        _afterTask(token, amount);
    }

    /**
     * @dev Sets the protocol fee withdrawer address
     * @param newProtocolFeeWithdrawer Address of the protocol fee withdrawer to be set
     */
    function _setProtocolFeeWithdrawer(address newProtocolFeeWithdrawer) internal {
        if (newProtocolFeeWithdrawer == address(0)) revert TaskProtocolFeeWithdrawerZero();
        protocolFeeWithdrawer = newProtocolFeeWithdrawer;
        emit ProtocolFeeWithdrawerSet(newProtocolFeeWithdrawer);
    }

    /**
     * @dev Sets the protocol fees collector address
     * @param newProtocolFeesCollector Address of the protocol fees collector to be set
     */
    function _setProtocolFeesCollector(address newProtocolFeesCollector) internal {
        if (newProtocolFeesCollector == address(0)) revert TaskProtocolFeesCollectorZero();
        protocolFeesCollector = newProtocolFeesCollector;
        emit ProtocolFeesCollectorSet(newProtocolFeesCollector);
    }

    /**
     * @dev Sets the balance connectors. Previous balance connector must be unset.
     * @param previous Balance connector id of the previous task in the workflow
     * @param next Balance connector id of the next task in the workflow
     */
    function _setBalanceConnectors(bytes32 previous, bytes32 next) internal virtual override {
        if (previous != bytes32(0)) revert TaskPreviousConnectorNotZero(previous);
        super._setBalanceConnectors(previous, next);
    }
}
