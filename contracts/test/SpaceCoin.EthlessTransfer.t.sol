// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import './utils/console.sol';
import './utils/stdlib.sol';
import './utils/test.sol';
import { CheatCodes } from './utils/cheatcodes.sol';

import { SpaceCoin } from '../SpaceCoin.sol';
import { EIP3009 } from '../abstract/EIP3009.sol';

import './SharedHelper.t.sol';

contract SpaceCoinTest is DSTest, SharedHelper {
    uint8 LOG_LEVEL = 0;

    function setUp() public {
        // Deploy contracts
        initialize_helper(LOG_LEVEL, address(this));
        if (LOG_LEVEL > 0) _changeLogLevel(LOG_LEVEL);
    }

    // Ethless Transfer
    function test_spaceCoin_ethless_transfer() public {
        uint256 amountToTransfer = 1000;
        uint256 startAfter = block.timestamp;
        bytes32 nonce = 0x0000000000000000000000000000000000000000000000000000000000eeeeaa;

        uint256 deadline = block.timestamp + 100;
        spaceCoin.transfer(USER1, amountToTransfer);

        vm.warp(startAfter + 1);
        eip712_transferWithAuthorization_verified(
            USER1,
            USER1_PRIVATEKEY,
            amountToTransfer,
            nonce,
            USER3,
            USER2,
            startAfter,
            deadline
        );
    }

    function test_spaceCoin_ethless_transfer_reuseSameNonce() public {
        uint256 amountToTransfer = 1000;
        uint256 startAfter = block.timestamp;
        bytes32 nonce = 0x000000000000000000000000000000000000000000000000000000000003fdd2;

        uint256 deadline = block.timestamp + 100;
        spaceCoin.transfer(USER1, amountToTransfer);

        vm.warp(startAfter + 1);
        eip712_transferWithAuthorization_verified(
            USER1,
            USER1_PRIVATEKEY,
            amountToTransfer,
            nonce,
            USER3,
            USER2,
            startAfter,
            deadline
        );
        eip712_transferWithAuthorization(
            USER1,
            USER1_PRIVATEKEY,
            amountToTransfer,
            nonce,
            USER3,
            USER2,
            startAfter,
            deadline,
            abi.encodeWithSelector(EIP3009.AuthorizationUsedOrCanceled.selector)
        );
    }

    function test_spaceCoin_ethless_transfer_wrongSender() public {
        uint256 amountToTransfer = 1000;
        uint256 startAfter = block.timestamp;
        uint256 deadline = block.timestamp + 100;
        bytes32 nonce = bytes32(block.number);
        spaceCoin.transfer(USER1, amountToTransfer);
        uint256 lowerAmountToTransfer = amountToTransfer - 18;

        (uint8 signV, bytes32 signR, bytes32 signS) = eip712_sign_transferWithAuthorization(
            USER2,
            USER2_PRIVATEKEY,
            USER3,
            lowerAmountToTransfer,
            nonce,
            startAfter,
            deadline
        );
        vm.warp(startAfter + 1);

        vm.prank(USER3);
        vm.expectRevert(abi.encodeWithSelector(EIP3009.InvalidSignature.selector));
        spaceCoin.transferWithAuthorization(
            USER1,
            USER3,
            lowerAmountToTransfer,
            startAfter,
            deadline,
            nonce,
            signV,
            signR,
            signS
        );
        assertEq(spaceCoin.balanceOf(USER1), amountToTransfer);
    }

    function test_spaceCoin_ethless_transfer_topUpInBetween() public {
        uint256 amountToTransfer = 1000 + 3;
        uint256 startAfter = block.timestamp;
        uint256 deadline = block.timestamp + 100;
        bytes32 nonce1 = 0x0000000000000000000000000000000000000000000000000000001000000ffe;
        spaceCoin.transfer(USER1, amountToTransfer);

        vm.warp(startAfter + 1);
        eip712_transferWithAuthorization_verified(
            USER1,
            USER1_PRIVATEKEY,
            amountToTransfer,
            nonce1,
            USER3,
            USER2,
            startAfter,
            deadline
        );

        uint256 newAmountToTransfer = 2;
        spaceCoin.transfer(USER1, newAmountToTransfer);
        bytes32 nonce2 = 0x0000000000000000000000000000000000000000000000000000003000000ffe;

        eip712_transferWithAuthorization_verified(
            USER1,
            USER1_PRIVATEKEY,
            newAmountToTransfer,
            nonce2,
            USER3,
            USER2,
            startAfter,
            deadline
        );
    }
}
