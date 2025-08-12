require('dotenv');
const { expect } = require('chai');
const TestHelper = require('../shared/helper');
const SignHelper = require('../shared/signature');
let owner;
let user1;
let user2;
let user3;
let spaceCoin;
let provider;

describe('SpaceCoin - Ethless Transfer functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [spaceCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('SpaceCoin - Regular Ethless Transfer', async function () {
        it('Test Ethless transfer', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();
            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                user2.address,
                amountToTransfer,
                validAfter,
                validBefore,
                nonce
            );
            await spaceCoin.transferWithAuthorization(
                owner.address,
                user2.address, 
                amountToTransfer, 
                validAfter, 
                validBefore, 
                nonce, 
                splitSignature.v, 
                splitSignature.r, 
                splitSignature.s
            );
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalBalance) - BigInt(amountToTransfer)
            );
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(BigInt(amountToTransfer));
        });

        it('Test Ethless transfer when amountToTransfer is the same balance', async () => {
            const amountToTransfer = await spaceCoin.balanceOf(owner.address);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();
            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                user2.address,
                amountToTransfer,
                validAfter,
                validBefore,
                nonce
            );
            await spaceCoin.transferWithAuthorization(
                owner.address,
                user2.address, 
                amountToTransfer, 
                validAfter, 
                validBefore, 
                nonce, 
                splitSignature.v, 
                splitSignature.r, 
                splitSignature.s
            );
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(0n);
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(BigInt(amountToTransfer));
        });
    });

    describe('SpaceCoin - Test expecting failure Ethless Transfer', async function () {
        const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

        it('Test Ethless transfer while reusing the signature on the second transfer', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();
            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                user2.address,
                amountToTransfer,
                validAfter,
                validBefore,
                nonce
            );
            await spaceCoin.transferWithAuthorization(
                owner.address,
                user2.address, 
                amountToTransfer, 
                validAfter, 
                validBefore, 
                nonce, 
                splitSignature.v, 
                splitSignature.r, 
                splitSignature.s
            );
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalBalance) - BigInt(amountToTransfer)
            );
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(BigInt(amountToTransfer));
            await expect(
                spaceCoin.connect(user3).transferWithAuthorization(
                    owner.address,
                    user3.address,
                    amountToTransfer,
                    validAfter,
                    validBefore,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'AuthorizationUsedOrCanceled');
        });

        it('Test Ethless transfer while using the signed by different sender', async () => {
            const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();
            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                user2.address,
                amountToTransfer,
                validAfter,
                validBefore,
                nonce
            );
            await expect(
                spaceCoin.connect(user3).transferWithAuthorization(
                    user1.address,
                    user2.address,
                    amountToTransfer,
                    validAfter,
                    validBefore,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'InvalidSignature');
        });

        it('Test Ethless transfer while reusing the same nonce on the second transfer', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const firstNonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                user2.address,
                amountToTransfer,
                validAfter,
                validBefore,
                firstNonce
            );
            await spaceCoin.transferWithAuthorization(
                owner.address,
                user2.address, 
                amountToTransfer, 
                validAfter, 
                validBefore, 
                firstNonce, 
                splitSignature.v, 
                splitSignature.r, 
                splitSignature.s
            );
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalBalance) - BigInt(amountToTransfer)
            );
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(BigInt(amountToTransfer));

            const splitSignature1 = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                user2.address,
                amountToTransfer + 1,
                validAfter,
                validBefore,
                firstNonce
            );
            await expect(
                spaceCoin.connect(user3).transferWithAuthorization(
                    owner.address,
                    user3.address,
                    amountToTransfer,
                    validAfter,
                    validBefore,
                    firstNonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'AuthorizationUsedOrCanceled');
        });

        it('Test Ethless transfer when amountToTransfer is higher than the balance', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                user2.address,
                originalBalance + BigInt(1),
                validAfter,
                validBefore,
                nonce
            );

            await expect(
                spaceCoin.transferWithAuthorization(
                    owner.address,
                    user2.address,
                    originalBalance + BigInt(1),
                    validAfter,
                    validBefore,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'ERC20InsufficientBalance');
        });

        it('Test Ethless transfer when amountToTransfer is higher than the signed one', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                user2.address,
                originalBalance,
                validAfter,
                validBefore,
                nonce
            );

            await expect(
                spaceCoin.transferWithAuthorization(
                    owner.address,
                    user2.address,
                    originalBalance + BigInt(1),
                    validAfter,
                    validBefore,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'InvalidSignature');
        });

        it('Test Ethless transfer when amountToTransfer is lower than the signed one', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                user2.address,
                originalBalance,
                validAfter,
                validBefore,
                nonce
            );

            await expect(
                spaceCoin.transferWithAuthorization(
                    owner.address,
                    user2.address,
                    originalBalance - BigInt(1),
                    validAfter,
                    validBefore,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'InvalidSignature');
        });

        it('Test Ethless transfer when the deadline passed', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp - 20000;
            const nonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                user2.address,
                originalBalance,
                validAfter,
                validBefore,
                nonce
            );

            await expect(
                spaceCoin.transferWithAuthorization(
                    owner.address,
                    user2.address,
                    originalBalance,
                    validAfter,
                    validBefore,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'NotInAuthorizationTime');
        });

        it('Test Ethless transfer before the validAfter', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp + 20000;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                await spaceCoin.getAddress(),
                owner,
                user2.address,
                originalBalance,
                validAfter,
                validBefore,
                nonce
            );

            await expect(
                spaceCoin.transferWithAuthorization(
                    owner.address,
                    user2.address,
                    originalBalance,
                    validAfter,
                    validBefore,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'NotInAuthorizationTime');
        });
    });
});
