// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Ethless
 */

import './EIP3009Base.sol';

abstract contract Ethless is EIP3009Base {
    /**
     * @notice Executes a token transfer authorized by an off-chain signature.
     * @param from          Address of the authorizer (payer).
     * @param to            Recipient address 
     * @param value         Amount to transfer.
     * @param validAfter    Time (unix) after which the authorization becomes valid.
     * @param validBefore   Time (unix) before which the authorization expires.
     * @param nonce         Unique 32-byte nonce to prevent replay.
     * @param v             of the signature
     * @param r             of the signature
     * @param s             of the signature
     */
    function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external override {
        _transferWithAuthorization(from, to, value, validAfter, validBefore, nonce, v, r, s);
    }

    /**
     * @notice Executes a transfer authorized by an off-chain signature, where the recipient must be msg.sender.
     * @dev Prevents front-running attacks by requiring to == msg.sender.
     * @param from          Address of the authorizer (payer).
     * @param to            Recipient address (must be msg.sender).
     * @param value         Amount to transfer.
     * @param validAfter    Time (unix) after which the authorization becomes valid.
     * @param validBefore   Time (unix) before which the authorization expires.
     * @param nonce         Unique 32-byte nonce to prevent replay.
     * @param v             of the signature
     * @param r             of the signature
     * @param s             of the signature
     */
    function receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external override {
        _receiveWithAuthorization(from, to, value, validAfter, validBefore, nonce, v, r, s);
    }

    /**
     * @notice Cancels a previously issued authorization via an EIP-712 signature.
     * @param authorizer    Address that signed the original authorization.
     * @param nonce         Nonce of the authorization to cancel.
     * @param v             of the signature
     * @param r             of the signature
     * @param s             of the signature
     */
    function cancelAuthorization(address authorizer, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external {
        _cancelAuthorization(authorizer, nonce, v, r, s);
    }
}
