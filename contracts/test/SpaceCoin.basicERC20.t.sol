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

    function setUp() public {
        // Deploy contracts
        initialize_helper(LOG_LEVEL, address(this));
        if (LOG_LEVEL > 0) _changeLogLevel(LOG_LEVEL);
    }

    // Basic ERC20 Call
    function test_spaceCoin_basicERC20_name() public {
        assertEq(spaceCoin.name(), NAME);
    }

    function test_spaceCoin_basicERC20_symbol() public {
        assertEq(spaceCoin.symbol(), SYMBOL);
    }

    function test_spaceCoin_basicERC20_decimals() public {
        assertEq(spaceCoin.decimals(), 18);
    }    
}
