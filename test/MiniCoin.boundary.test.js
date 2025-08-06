require('dotenv');
const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers, network } = require('hardhat');
const Chance = require('chance');
const TestHelper = require('./shared');
const SignHelper = require('./signature');
const ErrorMessages = require('./errorMessages');
const errorMessages = require('./errorMessages');

use(solidity);

let owner;
let user1;
let user2;
let user3;
let SpaceCoin;
let provider;
const zeroAddress = '0x0000000000000000000000000000000000000000';

describe('SpaceCoin - Boundary', function () {
    let originalBalance;
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [SpaceCoin] = await TestHelper.setupContractTesting(owner);
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
                const inputBurn = await spaceCoin.populateTransaction['burn(uint256)'](amount);
                msg = await TestHelper.submitTxnAndCheckResult(inputBurn, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test transfer() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            let msg;
            try {
                const inputTransfer = await spaceCoin.populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    amount,
                    { from: owner.address }
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    spaceCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test transferFrom() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            const inputApprove = await spaceCoin.populateTransaction.approve(user1.address, 1000);
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);

            let msg;
            try {
                const inputTransfer = await spaceCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    amount
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    spaceCoin.address,
                    user1,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test transfer(w/ signature) w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
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
                    nonce.toNumber(),
                    expirationTimestamp
                );
                const input = await spaceCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                    owner.address,
                    user1.address,
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

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
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
                    nonce.toNumber(),
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
                ethers.BigNumber.from(originalAllowance)
            );
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test reserve(w/ signature) w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });

            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = await SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    spaceCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    amount,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await spaceCoin.populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, owner.address, amount, feeToPay, nonce, expirationBlock, signature, {
                    from: owner.address
                });
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test approve() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            let msg;
            try {
                const input = await spaceCoin.populateTransaction.approve(spaceCoin.address, amount);
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test increaseAllowance() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            const input = await spaceCoin.populateTransaction.approve(spaceCoin.address, 1000);
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await spaceCoin.populateTransaction.increaseAllowance(
                    spaceCoin.address,
                    amount
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputIncreaseAllowance,
                    spaceCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(1000));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test decreaseAllowance() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            const inputApprove = await spaceCoin.populateTransaction.approve(spaceCoin.address, 1000);
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await spaceCoin.populateTransaction.decreaseAllowance(spaceCoin.address, amount);
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(1000));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });
    });

    describe('Test negative number on different fn()', () => {
        it('Test burn() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            let msg;
            try {
                const inputBurn = await spaceCoin.populateTransaction['burn(uint256)'](amount);
                msg = await TestHelper.submitTxnAndCheckResult(inputBurn, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            let msg;
            try {
                const inputTransfer = await spaceCoin.populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    amount,
                    { from: owner.address }
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    spaceCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transferFrom() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            const inputApprove = await spaceCoin.populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);

            let msg;
            try {
                const inputTransfer = await spaceCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    amount
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    spaceCoin.address,
                    user1,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
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
                    nonce.toNumber(),
                    expirationTimestamp
                );
                const input = await spaceCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                    owner.address,
                    user1.address,
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

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
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
                    nonce.toNumber(),
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
                ethers.BigNumber.from(originalAllowance)
            );
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test reserve(w/ signature) w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });

            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = await SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    spaceCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    amount,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await spaceCoin.populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, owner.address, amount, feeToPay, nonce, expirationBlock, signature, {
                    from: owner.address
                });
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test approve() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            let msg;
            try {
                const input = await spaceCoin.populateTransaction.approve(spaceCoin.address, amount);
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(0);
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test increaseAllowance() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            const input = await spaceCoin.populateTransaction.approve(spaceCoin.address, ethers.BigNumber.from(10000));
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await spaceCoin.populateTransaction.increaseAllowance(
                    spaceCoin.address,
                    amount
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputIncreaseAllowance,
                    spaceCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });
        it('Test decreaseAllowance() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            const inputApprove = await spaceCoin.populateTransaction.approve(
                spaceCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await spaceCoin.populateTransaction.decreaseAllowance(spaceCoin.address, amount);
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });
    });

    describe('Test zero(0) number on different fn()', () => {
        const amount = 0;
        it('Test burn() w/ zero(0) number', async () => {
            const inputBurn = await spaceCoin.populateTransaction['burn(uint256)'](amount);
            msg = await TestHelper.submitTxnAndCheckResult(inputBurn, spaceCoin.address, owner, ethers, provider, 0);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });

        it('Test transfer() w/ zero(0) number', async () => {
            const inputTransfer = await spaceCoin.populateTransaction['transfer(address,uint256)'](
                user1.address,
                amount,
                { from: owner.address }
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, spaceCoin.address, owner, ethers, provider, 0);

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
        });

        it('Test transferFrom() w/ zero(0) number', async () => {
            const amount = 0;
            const inputApprove = await spaceCoin.populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);

            const inputTransfer = await spaceCoin.connect(user1).populateTransaction.transferFrom(
                owner.address,
                user2.address,
                amount
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, spaceCoin.address, user1, ethers, provider, 0);

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
        });

        it('Test transfer(w/ signature) w/ negative number', async () => {
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
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await spaceCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                owner.address,
                user1.address,
                amount,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );

            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
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
                nonce.toNumber(),
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

            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            expect(await spaceCoin.allowance(owner.address, user2.address)).to.equal(
                ethers.BigNumber.from(originalAllowance)
            );
        });

        it('Test reserve(w/ signature) w/ zero(0) number', async () => {
            const feeToPay = 0;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                spaceCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amount,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await spaceCoin.populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](owner.address, user1.address, owner.address, amount, feeToPay, nonce, expirationBlock, signature, {
                from: owner.address,
                gasLimit: ethers.utils.hexlify(3000000)
            });
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });

        it('Test approve() w/ zero(0) number', async () => {
            const input = await spaceCoin.populateTransaction.approve(spaceCoin.address, amount);
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);

            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(0));
        });

        it('Test increaseAllowance() w/ zero(0) number', async () => {
            const input = await spaceCoin.populateTransaction.approve(spaceCoin.address, ethers.BigNumber.from(10000));
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            const inputIncreaseAllowance = await spaceCoin.populateTransaction.increaseAllowance(
                spaceCoin.address,
                amount
            );
            await TestHelper.submitTxnAndCheckResult(
                inputIncreaseAllowance,
                spaceCoin.address,
                owner,
                ethers,
                provider,
                0
            );

            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(10000));
        });

        it('Test decreaseAllowance() w/ zero(0) number', async () => {
            const inputAprove = await spaceCoin.populateTransaction.approve(
                spaceCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputAprove, spaceCoin.address, owner, ethers, provider, 0);
            const input = await spaceCoin.populateTransaction.decreaseAllowance(spaceCoin.address, amount);
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);

            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(10000));
        });
    });

    describe('Test overflow on different fn()', () => {
        const amount = 2 ** 256;
        it('Test burn() w/ overflow', async () => {
            let msg;
            try {
                const inputBurn = await spaceCoin.populateTransaction['burn(uint256)'](amount);
                msg = await TestHelper.submitTxnAndCheckResult(inputBurn, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.fault;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test transfer() w/ overflow', async () => {
            let msg;
            try {
                const inputTransfer = await spaceCoin.populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    amount,
                    { from: owner.address }
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    spaceCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.fault;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test transferFrom() w/ overflow', async () => {
            const inputApprove = await spaceCoin.populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);

            let msg;
            try {
                const inputTransfer = await spaceCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    amount
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    spaceCoin.address,
                    user1,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.fault;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
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
                    nonce.toNumber(),
                    expirationTimestamp
                );
                const input = await spaceCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                    owner.address,
                    user1.address,
                    amount,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.fault;
            }

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
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
                    nonce.toNumber(),
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
                msg = err.fault;
            }

            expect(await spaceCoin.allowance(owner.address, user2.address)).to.equal(
                ethers.BigNumber.from(originalAllowance)
            );
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test reserve(w/ signature) w/ overflow', async () => {
            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = await SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    spaceCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    amount,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await spaceCoin.populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, owner.address, amount, feeToPay, nonce, expirationBlock, signature, {
                    from: owner.address
                });
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.fault;
            }

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test approve() w/ overflow', async () => {
            let msg;
            try {
                const input = await spaceCoin.populateTransaction.approve(spaceCoin.address, amount);
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.fault;
            }
            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test increaseAllowance() w/ overflow', async () => {
            const input = await spaceCoin.populateTransaction.approve(spaceCoin.address, ethers.BigNumber.from(10000));
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await spaceCoin.populateTransaction.increaseAllowance(
                    spaceCoin.address,
                    amount
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputIncreaseAllowance,
                    spaceCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.fault;
            }
            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test decreaseAllowance() w/ overflow', async () => {
            const inputApprove = await spaceCoin.populateTransaction.approve(
                spaceCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await spaceCoin.populateTransaction.decreaseAllowance(spaceCoin.address, amount);
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.fault;
            }
            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });
    });

    describe('Test empty string on different fn()', () => {
        const emptyString = '';
        it('Test burn() w/ empty string', async () => {
            let msg;
            try {
                const inputBurn = await spaceCoin.populateTransaction['burn(uint256)'](emptyString);
                msg = await TestHelper.submitTxnAndCheckResult(inputBurn, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer() w/ empty string', async () => {
            let msg;
            try {
                const inputTransfer = await spaceCoin.populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    emptyString,
                    { from: owner.address }
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    spaceCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transferFrom() w/ empty string', async () => {
            const inputApprove = await spaceCoin.populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);

            let msg;
            try {
                const inputTransfer = await spaceCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    emptyString
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    spaceCoin.address,
                    user1,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
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
                    nonce.toNumber(),
                    expirationTimestamp
                );
                const input = await spaceCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                    owner.address,
                    user1.address,
                    emptyString,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
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
                    nonce.toNumber(),
                    expirationTimestamp
                );
                const input = await spaceCoin.populateTransaction.permit(
                    owner.address,
                    user2.address,
                    emptyString,
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
                ethers.BigNumber.from(originalAllowance)
            );
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test reserve(w/ signature) w/ empty string', async () => {
            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = await SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    spaceCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    emptyString,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await spaceCoin.populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](
                    owner.address,
                    user1.address,
                    owner.address,
                    emptyString,
                    feeToPay,
                    nonce,
                    expirationBlock,
                    signature,
                    { from: owner.address }
                );
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });
        it('Test approve() w/ empty string', async () => {
            const emptyString = '';
            let msg;
            try {
                const input = await spaceCoin.populateTransaction.approve(spaceCoin.address, emptyString);
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });
        it('Test increaseAllowance() w/ empty string', async () => {
            const emptyString = '';
            const input = await spaceCoin.populateTransaction.approve(spaceCoin.address, ethers.BigNumber.from(10000));
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await spaceCoin.populateTransaction.increaseAllowance(
                    spaceCoin.address,
                    emptyString
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputIncreaseAllowance,
                    spaceCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });
        it('Test decreaseAllowance() w/ empty string', async () => {
            const emptyString = '';
            const inputApprove = await spaceCoin.populateTransaction.approve(
                spaceCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await spaceCoin.populateTransaction.decreaseAllowance(spaceCoin.address, emptyString);
                msg = await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await spaceCoin.allowance(owner.address, spaceCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });
    });
});
