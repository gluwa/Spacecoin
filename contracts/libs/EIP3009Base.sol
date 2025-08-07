pragma solidity ^0.8.20;

import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/utils/cryptography/EIP712.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

import '../abstract/EIP3009.sol';

/**
 * @title EIP3009Base
 * @notice Internal implementation of gasless token transfers via the EIP-3009 standard.
 * @dev Contracts inheriting this must expose public functions wrapping these internals,
 *      and may add access control modifiers as needed.
 */
abstract contract EIP3009Base is EIP3009, ERC20, EIP712 {
    // keccak256("CancelAuthorization(address authorizer,bytes32 nonce)")
    bytes32 public constant CANCEL_AUTHORIZATION_TYPEHASH = 0x158b0a9edf7a828aad02f63cd515c68ef2f50ba807396f6d12842833a1597429;

    /**
     * @dev Tracks whether an authorization has been used or canceled.
     * Mapping: authorizer => nonce => used
     */
    mapping(address => mapping(bytes32 => bool)) private _authorizationStates;

    event AuthorizationCanceled(address indexed authorizer, bytes32 indexed nonce);

    /**
     * @notice Returns whether a given nonce has been used or canceled.
     * @param authorizer    Address that signed the authorization.
     * @param nonce         Unique 32-byte value tied to a specific authorization.
     * @return True         if the authorization has been used or canceled.
     */
    function authorizationState(address authorizer, bytes32 nonce) external view override returns (bool) {
        return _authorizationStates[authorizer][nonce];
    }

    /**
     * @notice Executes a token transfer authorized by an off-chain signature.
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
    function _transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) internal {
        _checkValidAuthorization(from, nonce, validAfter, validBefore);
        _checkValidSignature(from, keccak256(abi.encode(TRANSFER_WITH_AUTHORIZATION_TYPEHASH, from, to, value, validAfter, validBefore, nonce)), v, r, s);

        _markAuthorizationAsUsed(from, nonce);
        _transfer(from, to, value);
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
    function _receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) internal {
        if (to != msg.sender) revert CallerMustBePayee();
        _checkValidAuthorization(from, nonce, validAfter, validBefore);
        _checkValidSignature(from, keccak256(abi.encode(RECEIVE_WITH_AUTHORIZATION_TYPEHASH, from, to, value, validAfter, validBefore, nonce)), v, r, s);

        _markAuthorizationAsUsed(from, nonce);
        _transfer(from, to, value);
    }

    /**
     * @notice Cancels a previously issued authorization via an EIP-712 signature.
     * @param authorizer    Address that signed the original authorization.
     * @param nonce         Nonce of the authorization to cancel.
     * @param v             of the signature
     * @param r             of the signature
     * @param s             of the signature
     */
    function _cancelAuthorization(address authorizer, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) internal {
        _checkUnusedAuthorization(authorizer, nonce);
        _checkValidSignature(authorizer, keccak256(abi.encode(CANCEL_AUTHORIZATION_TYPEHASH, authorizer, nonce)), v, r, s);

        _authorizationStates[authorizer][nonce] = true;
        emit AuthorizationCanceled(authorizer, nonce);
    }

    /**
     * @dev Verifies that the given signature matches the expected signer and struct hash.
     * @param signer        Expected signer of the authorization.
     * @param structHash    EIP-712 hash of the structured data.
     * @param v             of the signature
     * @param r             of the signature
     * @param s             of the signature
     */
    function _checkValidSignature(address signer, bytes32 structHash, uint8 v, bytes32 r, bytes32 s) private view {
        if (signer != ECDSA.recover(_hashTypedDataV4(structHash), v, r, s)) revert InvalidSignature();
    }

    /**
     * @notice Check that an authorization is unused
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     */
    function _checkUnusedAuthorization(address authorizer, bytes32 nonce) private view {
        if (_authorizationStates[authorizer][nonce]) revert AuthorizationUsedOrCanceled();
    }

    /**
     * @notice Check that authorization is valid
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     * @param validAfter    The unix timestamp after which this is valid
     * @param validBefore   The unix timestamp before which this is valid 
     */
    function _checkValidAuthorization(address authorizer, bytes32 nonce, uint256 validAfter, uint256 validBefore) private view {
        uint256 time = block.timestamp;
        if (time < validAfter || time >= validBefore) {
            revert NotInAuthorizationTime();
        }
        _checkUnusedAuthorization(authorizer, nonce);
    }

    /**
     * @notice Mark an authorization nonce as used to prevent reuse
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     */
    function _markAuthorizationAsUsed(address authorizer, bytes32 nonce) private {
        _authorizationStates[authorizer][nonce] = true;
        emit AuthorizationUsed(authorizer, nonce);
    }
}
