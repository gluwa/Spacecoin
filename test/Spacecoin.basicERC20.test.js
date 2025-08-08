require('dotenv');
const { expect } = require('chai');
const { ethers, network } = require('hardhat');
const TestHelper = require('../shared/helper');
// const SignHelper = require('./signature');

let owner;
let user1;
let user2;
let user3;
// let SpaceCoin;
let provider;
// const zeroAddress = '0x0000000000000000000000000000000000000000';

describe('SpaceCoin - Basic ERC20 functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [SpaceCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('SpaceCoin - ERC20 Token Info', async function () {
        it('Token name is ' + TestHelper.NAME, async () => {
            expect(await spaceCoin.name()).to.equal(TestHelper.NAME);
        });
        it('Token symbol is ' + TestHelper.SYMBOLE, async () => {
            expect(await spaceCoin.symbol()).to.equal(TestHelper.SYMBOL);
        });
        it('Token decimals is ' + TestHelper.DECIMALS, async () => {
            expect(await spaceCoin.decimals()).to.equal(TestHelper.DECIMALS);
        });
        it('Supply verification for total supply as ' + TestHelper.TOTALSUPPLY, async () => {
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(TestHelper.TOTALSUPPLY);
            expect(await spaceCoin.totalSupply()).to.equal(TestHelper.TOTALSUPPLY);
        });
    });

    describe('SpaceCoin - Allowance', async function () {
        const amountToApprove = 100;
        const amountToIncrease = 100;
        const amountToDecrease = 50;

        beforeEach(async () => {
            const amountToTransfer = 100;
            const inputTransfer = await spaceCoin.populateTransaction['transfer(address,uint256)'](
                user1.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, spaceCoin.address, owner, ethers, provider, 0);
        });
        it('Test approve()', async () => {
            const inputApprove = await spaceCoin.populateTransaction.approve(user2.address, amountToApprove);
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, user1, ethers, provider, 0);
            expect((await spaceCoin.allowance(user1.address, user2.address)).toString()).to.equal(
                amountToApprove.toString()
            );
        });
        it('Test increaseAllowance()', async () => {
            const inputIncreaseAllowance = await spaceCoin.populateTransaction.increaseAllowance(
                user2.address,
                amountToIncrease
            );
            await TestHelper.submitTxnAndCheckResult(
                inputIncreaseAllowance,
                spaceCoin.address,
                user1,
                ethers,
                provider,
                0
            );
            expect((await spaceCoin.allowance(user1.address, user2.address)).toString()).to.equal(
                amountToIncrease.toString()
            );
        });
        it('Test decreaseAllowance()', async () => {
            const inputApprove = await spaceCoin.populateTransaction.approve(user2.address, amountToApprove);
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, user1, ethers, provider, 0);
            expect((await spaceCoin.allowance(user1.address, user2.address)).toString()).to.equal(
                amountToApprove.toString()
            );

            const inputDecreaseAllowance = await spaceCoin.populateTransaction.decreaseAllowance(
                user2.address,
                amountToDecrease
            );
            await TestHelper.submitTxnAndCheckResult(
                inputDecreaseAllowance,
                spaceCoin.address,
                user1,
                ethers,
                provider,
                0
            );
            expect((await spaceCoin.allowance(user1.address, user2.address)).toString()).to.equal((50).toString());
        });
    });

    describe('SpaceCoin - transfer and transferFrom', async function () {
        const amountToTransfer = 100;

        it('Test transfer() / verify balanceOf owner is -1000', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            const inputTransfer = await spaceCoin.populateTransaction['transfer(address,uint256)'](
                user2.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, spaceCoin.address, owner, ethers, provider, 0);

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToTransfer)
            );
            expect((await spaceCoin.balanceOf(user2.address)).toString()).to.equal(amountToTransfer.toString());
        });
        it('Test transferFrom() / verify balance of owner is -1000', async () => {
            const originalOwnerBalance = await spaceCoin.balanceOf(owner.address);
            const originalUser2Balance = await spaceCoin.balanceOf(user2.address);

            const inputApprove = await spaceCoin.populateTransaction.approve(user1.address, amountToTransfer);
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);

            const inputTransferFrom = await spaceCoin.populateTransaction.transferFrom(
                owner.address,
                user2.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputTransferFrom, spaceCoin.address, user1, ethers, provider, 0);

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalOwnerBalance).sub(amountToTransfer)
            );
            expect((await spaceCoin.balanceOf(user2.address)).toString()).to.equal(
                ethers.BigNumber.from(originalUser2Balance).add(amountToTransfer)
            );
        });
    });

    describe('SpaceCoin - burn', async function () {
        const amountToBurn = 100;

        it('Test burn() / verify balanceOf owner is -100', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            const inputTransfer = await spaceCoin.populateTransaction['burn(uint256)'](amountToBurn);
            await TestHelper.submitTxnAndCheckResult(inputTransfer, spaceCoin.address, owner, ethers, provider, 0);

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToBurn)
            );
        });
    });

    describe('SpaceCoin - Test expecting failure Allowance', async function () {
        const amountToApprove = 100;
        const amountToDecrease = 150;

        beforeEach(async () => {
            const amountToTransfer = 100;
            const inputTransfer = await spaceCoin.populateTransaction['transfer(address,uint256)'](
                user1.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, spaceCoin.address, owner, ethers, provider, 0);
        });
        it('Test decreaseAllowance() by more than the current allowance', async () => {
            const inputApprove = await spaceCoin.populateTransaction.approve(user2.address, amountToApprove);
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, user1, ethers, provider, 0);
            expect((await spaceCoin.allowance(user1.address, user2.address)).toString()).to.equal(
                amountToApprove.toString()
            );

            const inputDecreaseAllowance = await spaceCoin.populateTransaction.decreaseAllowance(
                user2.address,
                amountToDecrease
            );
            await TestHelper.submitTxnAndCheckResult(
                inputDecreaseAllowance,
                spaceCoin.address,
                user1,
                ethers,
                provider,
                'ERC20: decreased allowance below zero'
            );
        });
    });

    describe('SpaceCoin - Test expecting failure transfer and transferFrom', async function () {
        const amountToTransfer = 100;

        it('Test transfer() without balance', async () => {
            const originalUser1Balance = await spaceCoin.balanceOf(user1.address);

            const inputTransfer = await spaceCoin.populateTransaction['transfer(address,uint256)'](
                user2.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(
                inputTransfer,
                spaceCoin.address,
                user1,
                ethers,
                provider,
                'SpaceCoin: Insufficient balance'
            );
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(originalUser1Balance));
        });

        it('Test transferFrom() without allowance', async () => {
            const originalUser1Balance = await spaceCoin.balanceOf(user1.address);
            const originalUser3Balance = await spaceCoin.balanceOf(user3.address);

            const inputTransferFrom = await spaceCoin.populateTransaction.transferFrom(
                user1.address,
                user3.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(
                inputTransferFrom,
                spaceCoin.address,
                user2,
                ethers,
                provider,
                'ERC20: insufficient allowance'
            );
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(originalUser1Balance));
            expect(await spaceCoin.balanceOf(user3.address)).to.equal(ethers.BigNumber.from(originalUser3Balance));
        });
        it('Test transferFrom() without balance', async () => {
            const originalUser1Balance = await spaceCoin.balanceOf(user1.address);
            const originalUser3Balance = await spaceCoin.balanceOf(user3.address);

            const inputApprove = await spaceCoin.populateTransaction.approve(user2.address, amountToTransfer);
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, user1, ethers, provider, 0);

            const inputTransferFrom = await spaceCoin.populateTransaction.transferFrom(
                user1.address,
                user3.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(
                inputTransferFrom,
                spaceCoin.address,
                user2,
                ethers,
                provider,
                'SpaceCoin: Insufficient balance'
            );
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(originalUser1Balance));
            expect(await spaceCoin.balanceOf(user3.address)).to.equal(ethers.BigNumber.from(originalUser3Balance));
        });
        it('Test 2x transferFrom() second transferFrom will fail due to remaining allowance to low', async () => {
            const originalOwnerBalance = await spaceCoin.balanceOf(owner.address);
            const originalUser2Balance = await spaceCoin.balanceOf(user2.address);

            const inputApprove = await spaceCoin.populateTransaction.approve(user1.address, amountToTransfer);
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);

            const inputTransferFrom = await spaceCoin.populateTransaction.transferFrom(
                owner.address,
                user2.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputTransferFrom, spaceCoin.address, user1, ethers, provider, 0);

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalOwnerBalance).sub(amountToTransfer)
            );
            expect((await spaceCoin.balanceOf(user2.address)).toString()).to.equal(
                ethers.BigNumber.from(originalUser2Balance).add(amountToTransfer)
            );

            await TestHelper.submitTxnAndCheckResult(
                inputTransferFrom,
                spaceCoin.address,
                user1,
                ethers,
                provider,
                'ERC20: insufficient allowance'
            );
        });
    });

    describe('SpaceCoin - Test expecting failure burn', async function () {
        const amountToBurn = 100;

        it('Test burn() without balance', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            const inputTransfer = await spaceCoin.populateTransaction['burn(uint256)'](amountToBurn);
            await TestHelper.submitTxnAndCheckResult(
                inputTransfer,
                spaceCoin.address,
                user1,
                ethers,
                provider,
                'SpaceCoin: Insufficient balance'
            );

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });
    });

    describe('SpaceCoin - EIP-712 support', async function () {
        it('Return DOMAIN_SEPARATOR', async () => {
            let msg;
            try {
                await spaceCoin.DOMAIN_SEPARATOR();
                msg = 'DOMAIN_SEPARATOR succeeded';
            } catch {
                msg = 'DOMAIN_SEPARATOR failed';
            }
            expect(msg).to.be.equal('DOMAIN_SEPARATOR succeeded');
        });
    });
});
