// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '../abstract/EIP3009.sol';

import './utils/console.sol';
import './utils/stdlib.sol';
import './utils/test.sol';
import { CheatCodes } from './utils/cheatcodes.sol';

import { SpaceCoin } from '../SpaceCoin.sol';

contract SharedHelper is DSTest {
    // using console for console;
    Vm public constant vm = Vm(HEVM_ADDRESS);
    //CheatCodes cheats = CheatCodes(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);

    string constant NAME = 'Space Coin';
    string constant SYMBOL = 'SPC';

    uint256 constant TOTALSUPPLY = 300_000_000 * 10 ** 18;

    uint256 USER1_PRIVATEKEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 USER2_PRIVATEKEY = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 USER3_PRIVATEKEY = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
    uint256 USER4_PRIVATEKEY = 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6;
    uint256 USER5_PRIVATEKEY = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a;

    address USER1 = vm.addr(USER1_PRIVATEKEY);
    address USER2 = vm.addr(USER2_PRIVATEKEY);
    address USER3 = vm.addr(USER3_PRIVATEKEY);
    address USER4 = vm.addr(USER4_PRIVATEKEY);
    address USER5 = vm.addr(USER5_PRIVATEKEY);

    uint8 _LOG_LEVEL;
    SpaceCoin spaceCoin;
    address _testContractAddress;

    // Events
    function initialize_helper(uint8 LOG_LEVEL_, address testContractAddress_) internal {
        spaceCoin = new SpaceCoin(address(this), NAME, SYMBOL, 10 * 10 ** 24);
        _LOG_LEVEL = LOG_LEVEL_;
        _testContractAddress = testContractAddress_;
    }

    function _changeLogLevel(uint8 newLogLevel_) internal {
        _LOG_LEVEL = newLogLevel_;
    }

    function addEthSignedMessageHash(bytes32 hash_) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked('\x19Ethereum Signed Message:\n32', hash_));
    }

    function signHash(uint256 signerPrivateKey_, bytes32 hash_) internal returns (uint8, bytes32, bytes32) {
        return vm.sign(signerPrivateKey_, addEthSignedMessageHash(hash_));
    }

    function eip712_sign_permit(
        address signer_,
        uint256 signerPrivateKey_,
        uint256 amountToPermit_,
        uint256 nonce_,
        address spender_,
        uint256 deadline_
    ) internal returns (uint8 signV, bytes32 signR, bytes32 signS) {
        return
            vm.sign(
                signerPrivateKey_,
                keccak256(
                    abi.encodePacked(
                        '\x19\x01',
                        spaceCoin.DOMAIN_SEPARATOR(),
                        keccak256(
                            abi.encode(
                                keccak256(
                                    'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'
                                ),
                                signer_,
                                spender_,
                                amountToPermit_,
                                nonce_,
                                deadline_
                            )
                        )
                    )
                )
            );
    }

    function eip712_sign_transferWithAuthorization(
        address sender_,
        uint256 senderPrivateKey_,
        address recipient_,
        uint256 amount_,
        bytes32 nonce_,
        uint256 validAfter_,
        uint256 validBefore_
    ) internal returns (uint8 v, bytes32 r, bytes32 s) {
        bytes32 structHash = keccak256(
            abi.encode(
                spaceCoin.TRANSFER_WITH_AUTHORIZATION_TYPEHASH(),
                sender_,
                recipient_,
                amount_,
                validAfter_,
                validBefore_,
                nonce_
            )
        );

        bytes32 digest = keccak256(abi.encodePacked('\x19\x01', spaceCoin.DOMAIN_SEPARATOR(), structHash));

        return vm.sign(senderPrivateKey_, digest);
    }

    function eip712_permit(
        address signer_,
        uint256 signerPrivateKey_,
        uint256 amountToPermit_,
        uint256 nonce_,
        address spender_,
        address sender_,
        uint256 deadline_
    ) internal {
        (uint8 signV, bytes32 signR, bytes32 signS) = eip712_sign_permit(
            signer_,
            signerPrivateKey_,
            amountToPermit_,
            nonce_,
            spender_,
            deadline_
        );

        vm.prank(sender_);
        spaceCoin.permit(signer_, spender_, amountToPermit_, deadline_, signV, signR, signS);
    }

    function eip712_transferWithAuthorization(
        address signer_,
        uint256 signerPrivateKey_,
        uint256 amountToTransfer_,
        bytes32 nonce_,
        address recipient_,
        address sender_,
        uint256 validAfter_,
        uint256 validBefore_,
        bytes memory expectedError
    ) internal {
        (uint8 v, bytes32 r, bytes32 s) = eip712_sign_transferWithAuthorization(
            signer_,
            signerPrivateKey_,
            recipient_,
            amountToTransfer_,
            nonce_,
            validAfter_,
            validBefore_
        );

        vm.prank(sender_);
        if (expectedError.length > 0) {
            vm.expectRevert(expectedError);
        }

        spaceCoin.transferWithAuthorization(
            signer_,
            recipient_,
            amountToTransfer_,
            validAfter_,
            validBefore_,
            nonce_,
            v,
            r,
            s
        );
    }

    function eip712_permit_verified(
        address signer_,
        uint256 signerPrivateKey_,
        uint256 amountToPermit_,
        uint256 nonce_,
        address spender_,
        address sender_,
        uint256 deadline_
    ) internal {
        eip712_permit(signer_, signerPrivateKey_, amountToPermit_, nonce_, spender_, sender_, deadline_);

        assertEq(spaceCoin.allowance(signer_, spender_), amountToPermit_);
    }

    function eip712_transferWithAuthorization_verified(
        address signer_,
        uint256 signerPrivateKey_,
        uint256 amountToTransfer_,
        bytes32 nonce_,
        address recipient_,
        address sender_,
        uint256 validAfter_,
        uint256 validBefore_
    ) internal {
        uint256 orginalAmount = spaceCoin.balanceOf(recipient_);
        uint256 orginalAmountSigner = spaceCoin.balanceOf(signer_);

        eip712_transferWithAuthorization(
            signer_,
            signerPrivateKey_,
            amountToTransfer_,
            nonce_,
            recipient_,
            sender_,
            validAfter_,
            validBefore_,
            ''
        );
        assertEq(spaceCoin.balanceOf(signer_), orginalAmountSigner - amountToTransfer_);
        assertEq(spaceCoin.balanceOf(recipient_), orginalAmount + amountToTransfer_);
    }
}
