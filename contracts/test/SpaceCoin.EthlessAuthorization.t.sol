// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import './utils/console.sol';
import './utils/stdlib.sol';
import './utils/test.sol';
import { CheatCodes } from './utils/cheatcodes.sol';

import { SpaceCoin } from '../SpaceCoin.sol';

import './SharedHelper.t.sol';

contract SpaceCoinAuthorizationTest is DSTest, SharedHelper {
    uint8 LOG_LEVEL = 0;

    function setUp() public {
        // Deploy contracts
        initialize_helper(LOG_LEVEL, address(this));
        if (LOG_LEVEL > 0) _changeLogLevel(LOG_LEVEL);
        
        // Transfer some tokens to USER1 for testing
        uint256 transferAmount = 100_000;
        spaceCoin.transfer(USER1, transferAmount);
    }

    // Test basic functionality first
    function test_basic_setup() public {
        assertEq(spaceCoin.name(), "Space Coin");
        assertEq(spaceCoin.symbol(), "SPC");
        assertTrue(spaceCoin.balanceOf(USER1) > 0);
    }

    // Test cancelAuthorization functionality
    function test_cancelAuthorization_success() public {
        uint256 amountToTransfer = 10_000;
        uint256 validAfter = block.timestamp;
        uint256 validBefore = block.timestamp + 1000;
        bytes32 nonce = keccak256(abi.encodePacked("unique_nonce_1"));

        // First, create an authorization
        (uint8 v, bytes32 r, bytes32 s) = eip712_sign_transferWithAuthorization(
            USER1,
            USER1_PRIVATEKEY,
            USER2,
            amountToTransfer,
            nonce,
            validAfter,
            validBefore
        );

        // Cancel the authorization before it's used
        (uint8 cancelV, bytes32 cancelR, bytes32 cancelS) = eip712_sign_cancelAuthorization(
            USER1,
            USER1_PRIVATEKEY,
            nonce
        );

        vm.prank(USER1);
        spaceCoin.cancelAuthorization(USER1, nonce, cancelV, cancelR, cancelS);

        // Verify the authorization is canceled by trying to use it
        vm.prank(USER2);
        vm.expectRevert();
        spaceCoin.receiveWithAuthorization(
            USER1,
            USER2,
            amountToTransfer,
            validAfter,
            validBefore,
            nonce,
            v,
            r,
            s
        );
    }

    // Test receiveWithAuthorization functionality
    function test_receiveWithAuthorization_success() public {
        uint256 amountToTransfer = 10_000;
        uint256 validAfter = block.timestamp;
        uint256 validBefore = block.timestamp + 1000;
        bytes32 nonce = keccak256(abi.encodePacked("unique_nonce_4"));

        (uint8 v, bytes32 r, bytes32 s) = eip712_sign_receiveWithAuthorization(
            USER1,
            USER1_PRIVATEKEY,
            USER2,
            amountToTransfer,
            nonce,
            validAfter,
            validBefore
        );

        uint256 originalBalanceUser1 = spaceCoin.balanceOf(USER1);
        uint256 originalBalanceUser2 = spaceCoin.balanceOf(USER2);

        vm.prank(USER2);
        spaceCoin.receiveWithAuthorization(
            USER1,
            USER2,
            amountToTransfer,
            validAfter,
            validBefore,
            nonce,
            v,
            r,
            s
        );

        // Verify balances
        assertEq(spaceCoin.balanceOf(USER1), originalBalanceUser1 - amountToTransfer);
        assertEq(spaceCoin.balanceOf(USER2), originalBalanceUser2 + amountToTransfer);
    }

    function test_receiveWithAuthorization_wrongRecipient() public {
        uint256 amountToTransfer = 10_000;
        uint256 validAfter = block.timestamp;
        uint256 validBefore = block.timestamp + 1000;
        bytes32 nonce = keccak256(abi.encodePacked("unique_nonce_5"));

        (uint8 v, bytes32 r, bytes32 s) = eip712_sign_receiveWithAuthorization(
            USER1,
            USER1_PRIVATEKEY,
            USER2,
            amountToTransfer,
            nonce,
            validAfter,
            validBefore
        );

        // Try to receive with wrong recipient (USER3 instead of USER2)
        vm.prank(USER3);
        vm.expectRevert();
        spaceCoin.receiveWithAuthorization(
            USER1,
            USER2,
            amountToTransfer,
            validAfter,
            validBefore,
            nonce,
            v,
            r,
            s
        );
    }
} 