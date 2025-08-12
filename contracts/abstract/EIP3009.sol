// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title EIP3009 - ERC-3009 Transfer With Authorization Interface
/// @notice Enables gasless token transfers using EIP-712 signatures
abstract contract EIP3009 {
    error NotInAuthorizationTime();
    error AuthorizationUsedOrCanceled();
    error CallerMustBePayee();
    error InvalidSignature();

    /// @notice Emitted when an authorization is used
    /// @param authorizer Address that signed the authorization
    /// @param nonce Unique nonce used for the authorization
    event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);

    // keccak256("TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)")
    bytes32 public constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH = 0x7c7c6cdb67a18743f49ec6fa9b35f50d52ed05cbed4cc592e13b44501c1a2267;

    // keccak256("ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)")
    bytes32 public constant RECEIVE_WITH_AUTHORIZATION_TYPEHASH = 0xd099cc98ef71107a616c4f0f941f04c322d8e254fe26b3c6668db87aae413de8;

    /// @notice Returns true if the given nonce for the authorizer has been used or canceled
    /// @param authorizer   The address that signed the message
    /// @param nonce        The unique nonce included in the message to prevent replay
    function authorizationState(address authorizer, bytes32 nonce) external view virtual returns (bool);

    /// @notice Transfer tokens with a signed authorization
    /// @dev Signature must be a valid EIP-712 signature from `from` over the transfer data
    /// @param from         Address of the token holder (authorizer)
    /// @param to           Recipient address
    /// @param value        Amount to transfer
    /// @param validAfter   Earliest time the authorization is valid (unix timestamp)
    /// @param validBefore  Latest time the authorization is valid (unix timestamp)
    /// @param nonce        Unique nonce to prevent replay
    /// @param v            ECDSA v
    /// @param r            ECDSA r
    /// @param s            ECDSA s
    function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external virtual;

    /// @notice Receive tokens with a signed authorization from the token holder
    /// @dev Prevents front-running by requiring `to == msg.sender`
    /// @param from Address of the token holder (authorizer)
    /// @param to           Recipient address (must equal msg.sender)
    /// @param value        Amount to transfer
    /// @param validAfter   Earliest time the authorization is valid
    /// @param validBefore  Latest time the authorization is valid
    /// @param nonce        Unique nonce to prevent replay
    /// @param v            ECDSA v
    /// @param r            ECDSA r
    /// @param s            ECDSA s
    function receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external virtual;
}
