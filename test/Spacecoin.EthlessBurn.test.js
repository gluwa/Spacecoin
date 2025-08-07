require('dotenv');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const TestHelper = require('./shared');
const ErrorMessages = require('./errorMessages');

let owner;
let user1;
let user2;
let user3;
let SpaceCoin;
let provider;

describe('SpaceCoin - Ethless Burn functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [SpaceCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('SpaceCoin - Regular Ethless Burn', async function () {
        const amountToBurn = TestHelper.getRandomIntInRange(10, 200);

        it('Test Ethless burn', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user3.address);
            await TestHelper.executePermitFlow(provider, SpaceCoin, owner, user3, user3, amountToBurn);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToBurn);
            const input = await spaceCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToBurn)
            );
            expect(await spaceCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(0);
        });

        it('Test Ethless burn lesser than permit', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user3.address);
            await TestHelper.executePermitFlow(provider, SpaceCoin, owner, user3, user3, amountToBurn + 1);
            const input = await spaceCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToBurn)
            );
            expect(await spaceCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(1);
        });

        it('Test Ethless burn with approve', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user3.address);

            const inputApprove = await spaceCoin.populateTransaction.approve(user3.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToBurn);

            const input = await spaceCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToBurn)
            );
            expect(await spaceCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(0);
        });

        it('Test Ethless burn lesser than approve', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user3.address);
            const inputApprove = await spaceCoin.populateTransaction.approve(user3.address, amountToBurn + 1);
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);
            const input = await spaceCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToBurn)
            );
            expect(await spaceCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(1);
        });

        it('Test Ethless burn with different submitter from permit', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user3.address);
            await TestHelper.executePermitFlow(provider, SpaceCoin, owner, user3, user2, amountToBurn);
            const input = await spaceCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToBurn)
            );
            expect(await spaceCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
        });

        it('Test Ethless burn from received amount', async () => {
            await SpaceCoin['transfer(address,uint256)'](user1.address, amountToBurn);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(amountToBurn);
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user3.address);
            await TestHelper.executePermitFlow(provider, SpaceCoin, user1, user3, user2, amountToBurn);
            const input = await spaceCoin.populateTransaction.burnFrom(user1.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(0);
            expect(await spaceCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
        });

        it('Test Ethless burn some of the received amount', async () => {
            await SpaceCoin['transfer(address,uint256)'](user1.address, amountToBurn);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(amountToBurn);
            const newAmountToBurn = amountToBurn - 3;
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user3.address);
            await TestHelper.executePermitFlow(provider, SpaceCoin, user1, user3, user2, amountToBurn);
            const input = await spaceCoin.populateTransaction.burnFrom(user1.address, newAmountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(amountToBurn - newAmountToBurn);
            expect(await spaceCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
        });
    });

    describe('SpaceCoin - Test expecting failure Ethless Burn', async function () {
        const amountToBurn = TestHelper.getRandomIntInRange(10, 200);

        it('Test Ethless burn when there is no permit', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            const input = await spaceCoin.populateTransaction.burnFrom(owner.address, amountToBurn);

            await TestHelper.submitTxnAndCheckResult(
                input,
                spaceCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ERC20_INSUFFICIENT_ALLOWANCE
            );

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });

        it('Test Ethless self-burning without permit', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const input = await spaceCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(
                input,
                spaceCoin.address,
                owner,
                ethers,
                provider,
                ErrorMessages.ERC20_INSUFFICIENT_ALLOWANCE
            );
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });

        it('Test Ethless burn more than permit', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const permitAmount = amountToBurn - 1;
            await TestHelper.executePermitFlow(provider, SpaceCoin, owner, user3, user3, permitAmount);
            const input = await spaceCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(
                input,
                spaceCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ERC20_INSUFFICIENT_ALLOWANCE
            );
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));

            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(permitAmount);
        });

        it('Test Ethless burn multiple time than permit', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const amountAfterBurn = ethers.BigNumber.from(originalBalance).sub(amountToBurn);
            await TestHelper.executePermitFlow(provider, SpaceCoin, owner, user3, user3, amountToBurn);
            const input = await spaceCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(amountAfterBurn);

            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(0);

            const input1 = await spaceCoin.populateTransaction.burnFrom(owner.address, 1);
            await TestHelper.submitTxnAndCheckResult(
                input1,
                spaceCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ERC20_INSUFFICIENT_ALLOWANCE
            );
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(amountAfterBurn);
        });

        it('Test Ethless burn more than approved', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const amountToApprove = amountToBurn - 1;
            const inputApprove = await spaceCoin.populateTransaction.approve(user3.address, amountToApprove);
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);

            const input = await spaceCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(
                input,
                spaceCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ERC20_INSUFFICIENT_ALLOWANCE
            );
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));

            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToApprove);
        });
    });
});
