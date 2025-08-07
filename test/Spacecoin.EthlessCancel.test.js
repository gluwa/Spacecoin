require('dotenv');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const TestHelper = require('../shared/helper');
const SignHelper = require('../shared/signature');
let owner;
let user1;
let user2;
let user3;
let spaceCoin;
let provider;

const feeToPay = 0;

describe.only('SpaceCoin - Ethless Cancel Authorization functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [spaceCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('SpaceCoin - Regular Ethless Cancel Authorization', async function () {
        it('Test Ethless cancel authorization', async () => {
            const nonce = TestHelper.generateNonce();
            
            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);
            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            
            const transferSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                user2.address,
                100,
                validAfter,
                validBefore,
                nonce
            );
            
            expect(await spaceCoin.authorizationState(owner.address, nonce)).to.be.false;
            
            const cancelSignature = await SignHelper.signCancel(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                nonce
            );
            
            await spaceCoin.cancelAuthorization(
                owner.address,
                nonce,
                cancelSignature.v,
                cancelSignature.r,
                cancelSignature.s
            );
            
            expect(await spaceCoin.authorizationState(owner.address, nonce)).to.be.true;
            
            await expect(
                spaceCoin.transferWithAuthorization(
                    owner.address,
                    user2.address,
                    100,
                    validAfter,
                    validBefore,
                    nonce,
                    transferSignature.v,
                    transferSignature.r,
                    transferSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'AuthorizationUsedOrCanceled');
        });

        // it('Test Ethless cancel authorization when authorization is already used', async () => {
        //     const nonce = TestHelper.generateNonce();
            
        //     // First, create and use an authorization
        //     const [blockNumber] = await Promise.all([provider.getBlockNumber()]);
        //     const block = await provider.getBlock(blockNumber);
        //     const validAfter = block.timestamp;
        //     const validBefore = block.timestamp + 20000;
            
        //     const transferSignature = await SignHelper.signTransfer(
        //         TestHelper.NAME,
        //         TestHelper.VERSION_712,
        //         await spaceCoin.getAddress(),
        //         owner,
        //         user2.address,
        //         100,
        //         validAfter,
        //         validBefore,
        //         nonce
        //     );
            
        //     // Use the authorization
        //     await spaceCoin.transferWithAuthorization(
        //         owner.address,
        //         user2.address,
        //         100,
        //         validAfter,
        //         validBefore,
        //         nonce,
        //         transferSignature.v,
        //         transferSignature.r,
        //         transferSignature.s
        //     );
            
        //     // Check that the authorization is now used
        //     expect(await spaceCoin.authorizationState(owner.address, nonce)).to.be.true;
            
        //     // Try to cancel an already used authorization
        //     const cancelSignature = await SignHelper.signCancel(
        //         TestHelper.NAME,
        //         TestHelper.VERSION_712,
        //         await spaceCoin.getAddress(),
        //         owner,
        //         nonce
        //     );
            
        //     await expect(
        //         spaceCoin.cancelAuthorization(
        //             owner.address,
        //             nonce,
        //             cancelSignature.v,
        //             cancelSignature.r,
        //             cancelSignature.s
        //         )
        //     ).to.be.revertedWithCustomError(spaceCoin, 'AuthorizationUsedOrCanceled');
        // });
    });

    describe('SpaceCoin - Test expecting failure Ethless Cancel Authorization', async function () {
        it('Test Ethless cancel authorization with wrong signer', async () => {
            const nonce = TestHelper.generateNonce();
            
            const cancelSignature = await SignHelper.signCancel(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                user3,
                nonce
            );
            
            await expect(
                spaceCoin.cancelAuthorization(
                    owner.address,
                    nonce,
                    cancelSignature.v,
                    cancelSignature.r,
                    cancelSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'InvalidSignature');
        });

        it('Test Ethless cancel authorization with wrong authorizer', async () => {
            const nonce = TestHelper.generateNonce();
            
            const cancelSignature = await SignHelper.signCancel(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                nonce
            );
            
            // Try to cancel with wrong authorizer address
            await expect(
                spaceCoin.cancelAuthorization(
                    user1.address, // Wrong authorizer
                    nonce,
                    cancelSignature.v,
                    cancelSignature.r,
                    cancelSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'InvalidSignature');
        });

        // it('Test Ethless cancel authorization with wrong nonce', async () => {
        //     const nonce1 = TestHelper.generateNonce();
        //     const nonce2 = TestHelper.generateNonce();
            
        //     // Create a cancel signature for nonce1
        //     const cancelSignature = await SignHelper.signCancel(
        //         TestHelper.NAME,
        //         TestHelper.VERSION_712,
        //         await spaceCoin.getAddress(),
        //         owner,
        //         nonce1
        //     );
            
        //     // Try to cancel with wrong nonce
        //     await expect(
        //         spaceCoin.cancelAuthorization(
        //             owner.address,
        //             nonce2, // Wrong nonce
        //             cancelSignature.v,
        //             cancelSignature.r,
        //             cancelSignature.s
        //         )
        //     ).to.be.revertedWithCustomError(spaceCoin, 'InvalidSignature');
        // });

        // it('Test Ethless cancel authorization with tampered signature', async () => {
        //     const nonce = TestHelper.generateNonce();
            
        //     // Create a cancel signature
        //     const cancelSignature = await SignHelper.signCancel(
        //         TestHelper.NAME,
        //         TestHelper.VERSION_712,
        //         await spaceCoin.getAddress(),
        //         owner,
        //         nonce
        //     );
            
        //     // Try to cancel with tampered signature (wrong v value)
        //     await expect(
        //         spaceCoin.cancelAuthorization(
        //             owner.address,
        //             nonce,
        //             cancelSignature.v + 1, // Tampered v
        //             cancelSignature.r,
        //             cancelSignature.s
        //         )
        //     ).to.be.revertedWithCustomError(spaceCoin, 'InvalidSignature');
        // });

        // it('Test Ethless cancel authorization twice', async () => {
        //     const nonce = TestHelper.generateNonce();
            
        //     // Create a cancel signature
        //     const cancelSignature = await SignHelper.signCancel(
        //         TestHelper.NAME,
        //         TestHelper.VERSION_712,
        //         await spaceCoin.getAddress(),
        //         owner,
        //         nonce
        //     );
            
        //     // Cancel the authorization
        //     await spaceCoin.cancelAuthorization(
        //         owner.address,
        //         nonce,
        //         cancelSignature.v,
        //         cancelSignature.r,
        //         cancelSignature.s
        //     );
            
        //     // Check that the authorization is now used
        //     expect(await spaceCoin.authorizationState(owner.address, nonce)).to.be.true;
            
        //     // Try to cancel the same authorization again
        //     await expect(
        //         spaceCoin.cancelAuthorization(
        //             owner.address,
        //             nonce,
        //             cancelSignature.v,
        //             cancelSignature.r,
        //             cancelSignature.s
        //         )
        //     ).to.be.revertedWithCustomError(spaceCoin, 'AuthorizationUsedOrCanceled');
        // });

        // it('Test Ethless cancel authorization for non-existent authorization', async () => {
        //     const nonce = TestHelper.generateNonce();
            
        //     // Create a cancel signature
        //     const cancelSignature = await SignHelper.signCancel(
        //         TestHelper.NAME,
        //         TestHelper.VERSION_712,
        //         await spaceCoin.getAddress(),
        //         owner,
        //         nonce
        //     );
            
        //     // Cancel the authorization (this should work even for non-existent authorizations)
        //     await spaceCoin.cancelAuthorization(
        //         owner.address,
        //         nonce,
        //         cancelSignature.v,
        //         cancelSignature.r,
        //         cancelSignature.s
        //     );
            
        //     // Check that the authorization is now marked as used
        //     expect(await spaceCoin.authorizationState(owner.address, nonce)).to.be.true;
        // });

        // it('Test Ethless cancel authorization with expired signature', async () => {
        //     const nonce = TestHelper.generateNonce();
            
        //     // Create a cancel signature
        //     const cancelSignature = await SignHelper.signCancel(
        //         TestHelper.NAME,
        //         TestHelper.VERSION_712,
        //         await spaceCoin.getAddress(),
        //         owner,
        //         nonce
        //     );
            
        //     // Cancel the authorization
        //     await spaceCoin.cancelAuthorization(
        //         owner.address,
        //         nonce,
        //         cancelSignature.v,
        //         cancelSignature.r,
        //         cancelSignature.s
        //     );
            
        //     // Check that the authorization is now used
        //     expect(await spaceCoin.authorizationState(owner.address, nonce)).to.be.true;
            
        //     // Try to cancel again with the same signature (should fail)
        //     await expect(
        //         spaceCoin.cancelAuthorization(
        //             owner.address,
        //             nonce,
        //             cancelSignature.v,
        //             cancelSignature.r,
        //             cancelSignature.s
        //         )
        //     ).to.be.revertedWithCustomError(spaceCoin, 'AuthorizationUsedOrCanceled');
        // });
    });
});
