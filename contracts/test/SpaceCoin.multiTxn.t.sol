// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import './utils/console.sol';
import './utils/stdlib.sol';
import './utils/test.sol';
import { CheatCodes } from './utils/cheatcodes.sol';

import { SpaceCoin } from '../SpaceCoin.sol';

import './SharedHelper.t.sol';

contract SpaceCoinTest is DSTest, SharedHelper {

    uint8 LOG_LEVEL = 0;
    uint256 ORIGIN_BLOCK_NUMBER = block.number;

    function setUp() public {
        // Deploy contracts
        initialize_helper(LOG_LEVEL, address(this));
        if (LOG_LEVEL > 0) _changeLogLevel(LOG_LEVEL);
    }

    // Complex scenario
    function test_spaceCoin_multiTxn_transferAndBurn_sameBlock() public {
        uint256 AMOUNT_TO_TRANSFER = 100 * 10 ** 18;
        if (LOG_LEVEL > 0) _changeLogLevel(LOG_LEVEL);
        spaceCoin.transfer(USER1, AMOUNT_TO_TRANSFER);

        vm.prank(USER1);
        spaceCoin.burn(AMOUNT_TO_TRANSFER);

        assertEq(spaceCoin.balanceOf(address(this)), TOTALSUPPLY - AMOUNT_TO_TRANSFER);
        assertEq(spaceCoin.balanceOf(USER1), 0);
        assertEq(block.number, ORIGIN_BLOCK_NUMBER);
    }

    function test_spaceCoin_multiTxn_permitAndTransferFrom_sameBlock() public {
        uint256 AMOUNT_TO_TRANSFER = 100 * 10 ** 18;

        spaceCoin.transfer(USER1, AMOUNT_TO_TRANSFER);

        uint256 deadline = block.timestamp+ 100;

        eip712_permit_verified(
            USER1,
            USER1_PRIVATEKEY,
            AMOUNT_TO_TRANSFER,
            spaceCoin.nonces(USER1),
            USER3,
            USER2,
            deadline
        );

        vm.prank(USER3);

        spaceCoin.transferFrom(USER1, USER2, AMOUNT_TO_TRANSFER);
        assertEq(spaceCoin.balanceOf(USER2), AMOUNT_TO_TRANSFER);
        assertEq(block.number, ORIGIN_BLOCK_NUMBER);
    }

    function test_spaceCoin_multiTxn_allEthless_sameNonce_sameBlock() public {
        uint256 AMOUNT_TO_TRANSFER = 100 * 10 ** 18;
        uint256 AMOUNT_TO_RESERVE = 40 * 10 ** 18;
        uint256 startOn = block.timestamp;
        uint256 deadline = block.timestamp+ 100;
        uint256 feeToPay = 100;
        bytes32 nonce = 0x000000000000000000000000000000000000000000000000000000000000d515;
        spaceCoin.transfer(USER1, AMOUNT_TO_TRANSFER + AMOUNT_TO_RESERVE + feeToPay);

        eip712_transferWithAuthorization_verified(
            USER1,
            USER1_PRIVATEKEY,
            AMOUNT_TO_TRANSFER,
            nonce,
            USER3,
            USER2,
            startOn,
            deadline
        );

        assertEq(block.number, ORIGIN_BLOCK_NUMBER);
    }

    function test_spaceCoin_multiTxn_burnFromAfterTransfer_sameBlock() public {
        uint256 amountToTransfer = 1000;
        uint256 amountToBurn = 600;
        uint256 startOn = block.timestamp;
        uint256 deadline = block.timestamp+ 100;
        bytes32 nonce = 0x000000000000000000000000000000000000000000000000000000000001e725;

        uint256 originalBalance = amountToTransfer + amountToBurn + 1;
        spaceCoin.transfer(USER1, originalBalance);

        eip712_transferWithAuthorization_verified(
            USER1,
            USER1_PRIVATEKEY,
            amountToTransfer,
            nonce,
            USER3,
            USER2,
            startOn,
            deadline
        );
        eip712_permit_verified(USER1, USER1_PRIVATEKEY, amountToBurn, spaceCoin.nonces(USER1), USER2, USER2, deadline);

        vm.prank(USER2);
        spaceCoin.burnFrom(USER1, amountToBurn);
        assertEq(spaceCoin.balanceOf(USER1), originalBalance - amountToBurn - amountToTransfer);
        assertEq(block.number, ORIGIN_BLOCK_NUMBER);
    }
}
