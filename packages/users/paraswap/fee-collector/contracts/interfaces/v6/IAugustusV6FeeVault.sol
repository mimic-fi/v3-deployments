// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

/// @title IAugustusFeeVault
/// @notice Interface for the AugustusFeeVault contract
interface IAugustusV6FeeVault {
    /// @notice Allows partners to collect fees allocated to them and stored in the vault
    /// @param token The token to collect fees in
    /// @param amount The amount of fees to collect
    /// @param beneficiary The address to collect the fees for
    /// @param recipient The address to send the fees to
    /// @return success Whether the transfer was successful or not
    function collect(address token, uint256 amount, address beneficiary, address recipient) external returns (bool);

    /// @notice Get the balance of a given token for a given partner
    /// @param token The token to get the balance of
    /// @param partner The partner to get the balance for
    /// @return feeBalance The balance of the given token for the given partner
    function getBalance(address token, address partner) external view returns (uint256 feeBalance);
}
