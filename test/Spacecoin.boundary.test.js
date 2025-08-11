require('dotenv');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const Chance = require('chance');
const TestHelper = require('../shared/helper');
const SignHelper = require('../shared/signature');

let owner;
let user1;
let user2;
let user3;
let spaceCoin;
let provider;

describe('SpaceCoin - Boundary', function () {
    let originalBalance;
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [spaceCoin] = await TestHelper.setupContractTesting(owner);
        originalBalance = await spaceCoin.balanceOf(owner.address);
    });

    describe('Test floating point on different fn()', () => {
        it('Test burn() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            let msg;
            try {
                await spaceCoin.connect(owner).burn(amount);
            } catch (err) {
                msg = err.code;
            }
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            let msg;
            try {
                await spaceCoin.connect(owner).transfer(user1.address, amount);
            } catch (err) {
                msg = err.code;
            }
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transferFrom() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            await spaceCoin.connect(user1).approve(owner.address, 1000);

            let msg;
            try {
                await spaceCoin.connect(user1).transferFrom(owner.address, user2.address, amount);
            } catch (err) {
                msg = err.code;
            }
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer(w/ signature) w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            let msg;
            try {
                const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), spaceCoin.nonces(owner.address)]);
                const block = await provider.getBlock(blockNumber);
                const expirationTimestamp = block.timestamp + 20000;
                const splitSignature = await SignHelper.signTransfer(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    spaceCoin.address,
                    owner,
                    user1.address,
                    amount,
                    expirationTimestamp,
                    expirationTimestamp + 1000,
                    nonce
                );
                await spaceCoin.connect(owner).transferWithAuthorization(
                    owner.address,
                    user2.address,
                    amount,
                    expirationTimestamp,
                    expirationTimestamp + 1000,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );
            } catch (err) {
                msg = err.code;
            }
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test permit(w/ signature) w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), spaceCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const originalAllowance = await spaceCoin.allowance(owner.address, user2.address);

            let msg;
            try {
                const splitSignature = await SignHelper.signPermit(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    spaceCoin.address,
                    owner,
                    user2.address,
                    amount,
                    nonce,
                    expirationTimestamp
                );
                const input = await spaceCoin.populateTransaction.permit(
                    owner.address,
                    user2.address,
                    amount,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );

                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.allowance(owner.address, user2.address)).to.equal(
                originalAllowance
            );
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test approve() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            let msg;
            try {
                msg = await spaceCoin.connect(owner).approve(user2.address, amount);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.allowance(owner.address, user2.address)).to.equal(0);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });
    });

    describe('Test negative number on different fn()', () => {
        it('Test burn() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            let msg;
            try {
                msg = await spaceCoin.connect(owner).burn(amount);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            let msg;
            try {
                msg = await spaceCoin.connect(owner).transfer(user1.address, amount);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(0);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transferFrom() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            await spaceCoin.connect(user1).approve(owner.address, 10000);

            let msg;
            try {
                msg = await spaceCoin.connect(user1).transferFrom(owner.address, user2.address, amount);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(0);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer(w/ signature) w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });

            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), spaceCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            let msg;
            try {
                const splitSignature = await SignHelper.signTransfer(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    spaceCoin.address,
                    owner,
                    user1.address,
                    amount,
                    expirationTimestamp,
                    expirationTimestamp + 1000,
                    nonce
                );
                msg = await spaceCoin.connect(owner).transferWithAuthorization(
                    owner.address,
                    user1.address,
                    amount,
                    expirationTimestamp,
                    expirationTimestamp + 1000,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );

            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test permit(w/ signature) w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), spaceCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const originalAllowance = await spaceCoin.allowance(owner.address, user2.address);

            let msg;
            try {
                const splitSignature = await SignHelper.signPermit(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    spaceCoin.address,
                    owner,
                    user2.address,
                    amount,
                    nonce,
                    expirationTimestamp
                );
                msg = await spaceCoin.connect(owner).permit(
                    owner.address,
                    user2.address,
                    amount,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );

            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.allowance(owner.address, user2.address)).to.equal(
                originalAllowance
            );
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test approve() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            let msg;
            try {
                msg = await spaceCoin.connect(owner).approve(user2.address, amount);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.allowance(owner.address, user2.address)).to.equal(0);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });
    });

    describe('Test zero(0) number on different fn()', () => {
        const amount = 0;
        it('Test burn() w/ zero(0) number', async () => {
            let msg;
            try {
                msg = await spaceCoin.connect(owner).burn(amount);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
        });

        it('Test transfer() w/ zero(0) number', async () => {
            let msg;
            try {
                msg = await spaceCoin.connect(owner).transfer(user1.address, amount);
            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(0);
        });

        it('Test transferFrom() w/ zero(0) number', async () => {
            const amount = 0;
            await spaceCoin.connect(user1).approve(owner.address, 10000);

            let msg;
            try {
                msg = await spaceCoin.connect(user1).transferFrom(
                owner.address,
                user2.address,
                amount
            );
            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(0);
        });

        it('Test transfer(w/ signature) w/ zero(0) number', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), spaceCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            try {
                msg = await SignHelper.signTransfer(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    await spaceCoin.getAddress(),
                    owner,
                    user1.address,
                    amount,
                    expirationTimestamp,
                    expirationTimestamp + 1000,
                    nonce,
                );  
            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
        });

        it('Test permit(w/ signature) w/ zero(0)', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), spaceCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const originalAllowance = await spaceCoin.allowance(owner.address, user2.address);

            const splitSignature = await SignHelper.signPermit(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                spaceCoin.address,
                owner,
                user2.address,
                amount,
                nonce,
                expirationTimestamp
            );
            
            let msg;
            try {
                msg = await spaceCoin.connect(owner).permit(
                    owner.address,
                    user2.address,
                    amount,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );
            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.allowance(owner.address, user2.address)).to.equal(
                originalAllowance
            );
        });

        it('Test approve() w/ zero(0) number', async () => {
            let msg;
            try {
                msg = await spaceCoin.connect(owner).approve(user2.address, amount);
            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.allowance(owner.address, user2.address)).to.equal(0);
        });
    });

    describe('Test overflow on different fn()', () => {
        const amount = 2n ** 256n;
        it('Test burn() w/ overflow', async () => {
            let msg;
            try {
                msg = await spaceCoin.connect(owner).burn(amount);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer() w/ overflow', async () => {
            let msg;
            try {
                msg = await spaceCoin.connect(owner).transfer(user1.address, amount);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(0);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transferFrom() w/ overflow', async () => {
            await spaceCoin.connect(user1).approve(owner.address, 10000);

            let msg;
            try {
                msg = await spaceCoin.connect(user1).transferFrom(
                    owner.address,
                    user2.address,
                    amount
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(0);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer(w/ signature) w/ overflow', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), spaceCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            let msg;
            try {
                const splitSignature = await SignHelper.signTransfer(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    spaceCoin.address,
                    owner,
                    user1.address,
                    amount,
                    expirationTimestamp,
                    expirationTimestamp + 1000,
                    nonce
                );
                msg = await spaceCoin.connect(owner).transferWithAuthorization(
                    owner.address,
                    user1.address,
                    amount,
                    expirationTimestamp,
                    expirationTimestamp + 1000,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );
            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test permit(w/ signature) w/ overflow', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), spaceCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const originalAllowance = await spaceCoin.allowance(owner.address, user2.address);

            let msg;
            try {
                const splitSignature = await SignHelper.signPermit(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    spaceCoin.address,
                    owner,
                    user2.address,
                    amount,
                    nonce,
                    expirationTimestamp
                );
                msg = await spaceCoin.connect(owner).permit(
                    owner.address,
                    user2.address,
                    amount,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );

            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.allowance(owner.address, user2.address)).to.equal(
                originalAllowance
            );
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test approve() w/ overflow', async () => {
            let msg;
            try {
                msg = await spaceCoin.connect(owner).approve(user2.address, amount);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.allowance(owner.address, user2.address)).to.equal(0);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });
    });

    describe('Test empty string on different fn()', () => {
        const emptyString = '';
        it('Test burn() w/ empty string', async () => {
            let msg;
            try {
                msg = await spaceCoin.connect(owner).burn(emptyString);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer() w/ empty string', async () => {
            let msg;
            try {
                msg = await spaceCoin.connect(owner).transfer(user1.address, emptyString);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(0);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transferFrom() w/ empty string', async () => {
            await spaceCoin.connect(user1).approve(owner.address, 10000);

            let msg;
            try {
                msg = await spaceCoin.connect(user1).transferFrom(
                    owner.address,
                    user2.address,
                    emptyString
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(0);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer(w/ signature) w/ empty string', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), spaceCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            let msg;
            try {
                const splitSignature = await SignHelper.signTransfer(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    spaceCoin.address,
                    owner,
                    user1.address,
                    emptyString,
                    expirationTimestamp,
                    expirationTimestamp + 1000,
                    nonce
                );
                msg = await spaceCoin.connect(owner).transferWithAuthorization(
                    owner.address,
                    user1.address,
                    emptyString,
                    expirationTimestamp,
                    expirationTimestamp + 1000,
                    nonce,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );
            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(originalBalance);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test permit(w/ signature) w/ empty string', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), spaceCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const originalAllowance = await spaceCoin.allowance(owner.address, user2.address);

            let msg;
            try {
                const splitSignature = await SignHelper.signPermit(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    spaceCoin.address,
                    owner,
                    user2.address,
                    emptyString,
                    nonce,
                    expirationTimestamp
                );
                msg = await spaceCoin.connect(owner).permit(
                    owner.address,
                    user2.address,
                    emptyString,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );

            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.allowance(owner.address, user2.address)).to.equal(
                originalAllowance
            );
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test approve() w/ empty string', async () => {
            const emptyString = '';
            let msg;
            try {
                msg = await spaceCoin.connect(owner).approve(user2.address, emptyString);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.allowance(owner.address, user2.address)).to.equal(0);
            expect(msg).to.equal(TestHelper.ErrorMessages.INVALID_ARGUMENT_CODE);
        });
    });
});
