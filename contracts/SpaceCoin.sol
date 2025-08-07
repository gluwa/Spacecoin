// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SpaceCoin
 */

import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';

import './libs/Ethless.sol';

contract SpaceCoin is Ethless, ERC20Permit, ERC20Burnable {
    /// The contract is intended to be deployed as non-upgradeable
    constructor(
        address holder_,
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        _mint(holder_, totalSupply_);
    }
    
}