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

describe('SpaceCoin - Ethless Receive functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [spaceCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('SpaceCoin - Regular Ethless Receive', async function () {
        it('Test Ethless receive', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();
            
            const splitSignature = await SignHelper.signReceive(
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
            
            await spaceCoin.connect(user2).receiveWithAuthorization(
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

        it('Test Ethless receive when amountToTransfer is the same balance', async () => {
            const amountToTransfer = await spaceCoin.balanceOf(owner.address);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();
            
            const splitSignature = await SignHelper.signReceive(
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
            
            await spaceCoin.connect(user2).receiveWithAuthorization(
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

    describe('SpaceCoin - Test expecting failure Ethless Receive', async function () {
        const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

        it('Test Ethless receive while reusing the signature on the second transfer', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signReceive(
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
            
            await spaceCoin.connect(user2).receiveWithAuthorization(
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
            
            // Second call with same signature should fail
            await expect(
                spaceCoin.connect(user3).receiveWithAuthorization(
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

        it('Test Ethless receive while using the signed by different sender', async () => {
                const originalBalance = await spaceCoin.balanceOf(owner.address);
            const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signReceive(
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
                spaceCoin.connect(user3).receiveWithAuthorization(
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
            ).to.be.revertedWithCustomError(spaceCoin, 'CallerMustBePayee');
        });
        
        it('Test Ethless receive while using the signed by different sender', async () => {
            const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signReceive(
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
            
            await expect(spaceCoin.connect(user2).receiveWithAuthorization(
                user1.address,
                user2.address,
                amountToTransfer,
                validAfter,
                validBefore,
                nonce,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            )).to.be.revertedWithCustomError(spaceCoin, 'InvalidSignature');
        });

        it('Test Ethless receive while reusing the same nonce on the second transfer', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signReceive(
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
            
            await spaceCoin.connect(user2).receiveWithAuthorization(
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
                spaceCoin.connect(user2).receiveWithAuthorization(
                    owner.address,
                    user2.address,
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

        it('Test Ethless receive when amountToTransfer is higher than the balance', async () => {
            const amountToTransfer = await spaceCoin.balanceOf(owner.address) + BigInt(1);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();
            
            const splitSignature = await SignHelper.signReceive(
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
                spaceCoin.connect(user2).receiveWithAuthorization(
                    owner.address,
                    user2.address,
                    amountToTransfer,
                    validAfter,
                    validBefore,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'ERC20InsufficientBalance');
        });

        it('Test Ethless receive when amountToTransfer is higher than the signed one', async () => {
            const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signReceive(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                spaceCoin.address,
                owner,
                user2.address,
                amountToTransfer,
                validAfter,
                validBefore,
                nonce
            );
            
            await expect(
                spaceCoin.connect(user2).receiveWithAuthorization(
                    owner.address,
                    user2.address,
                    amountToTransfer + 1,
                    validAfter,
                    validBefore,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'InvalidSignature');
        });

        it('Test Ethless receive when amountToTransfer is lower than the signed one', async () => {
            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signReceive(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                spaceCoin.address,
                owner,
                user2.address,
                amountToTransfer,
                validAfter,
                validBefore,
                nonce
            );
            
            await expect(
                spaceCoin.connect(user2).receiveWithAuthorization(
                    owner.address,
                    user2.address,
                    amountToTransfer - 1, // Different amount than signed
                    validAfter,
                    validBefore,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'InvalidSignature');
        });

        it('Test Ethless receive when the deadline passed', async () => {
            const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp - 20000;
            const nonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signReceive(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                spaceCoin.address,
                owner,
                user2.address,
                amountToTransfer,
                validAfter,
                validBefore,
                nonce
            );
            
            await expect(
                spaceCoin.connect(user2).receiveWithAuthorization(
                    owner.address,
                    user2.address,
                    amountToTransfer,
                    validAfter,
                    validBefore,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'NotInAuthorizationTime');
        });

        it('Test Ethless receive when caller is not the recipient', async () => {
            const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

            const [blockNumber] = await Promise.all([provider.getBlockNumber()]);

            const block = await provider.getBlock(blockNumber);
            const validAfter = block.timestamp;
            const validBefore = block.timestamp + 20000;
            const nonce = TestHelper.generateNonce();

            const splitSignature = await SignHelper.signReceive(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                spaceCoin.address,
                owner,
                user2.address,
                amountToTransfer,
                validAfter,
                validBefore,
                nonce
            );
            
            await expect(
                spaceCoin.connect(user3).receiveWithAuthorization(
                    owner.address,
                    user2.address,
                    amountToTransfer,
                    validAfter,
                    validBefore,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                )
            ).to.be.revertedWithCustomError(spaceCoin, 'CallerMustBePayee');
        });
    });
});
