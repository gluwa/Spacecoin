require('dotenv');
const { expect } = require('chai');
const TestHelper = require('../shared/helper');

let owner;
let user1;
let user2;
let user3;
let spaceCoin;
let provider;

describe('SpaceCoin - Ethless Burn functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [spaceCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('SpaceCoin - Regular Ethless Burn', async function () {
        const amountToBurn = TestHelper.getRandomIntInRange(10, 200);

        it('Test Ethless burn', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user2.address);
            await TestHelper.executePermitFlow(provider, spaceCoin, owner, user3, user2, amountToBurn);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToBurn);
            await spaceCoin.connect(user3).burnFrom(owner.address, amountToBurn);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalBalance) - BigInt(amountToBurn)
            );
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(originalBalanceSubmitter);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(0);
        });

        it('Test Ethless burn lesser than permit', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user2.address);
            await TestHelper.executePermitFlow(provider, spaceCoin, owner, user3, user2, amountToBurn + 1);
            await spaceCoin.connect(user3).burnFrom(owner.address, amountToBurn);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalBalance) - BigInt(amountToBurn)
            );
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(originalBalanceSubmitter);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(1);
        });

        it('Test Ethless burn with approve', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user2.address);

            await spaceCoin.connect(owner).approve(user3.address, amountToBurn);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToBurn);

            await spaceCoin.connect(user3).burnFrom(owner.address, amountToBurn);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalBalance) - BigInt(amountToBurn)
            );
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(originalBalanceSubmitter);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(0);
        });

        it('Test Ethless burn lesser than approve', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user2.address);
            await spaceCoin.connect(owner).approve(user3.address, amountToBurn + 1);
            await spaceCoin.connect(user3).burnFrom(owner.address, amountToBurn);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalBalance) - BigInt(amountToBurn)
            );
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(originalBalanceSubmitter);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(1);
        });

        it('Test Ethless burn with different submitter from permit', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user2.address);
            await TestHelper.executePermitFlow(provider, spaceCoin, owner, user3, user2, amountToBurn);
            await spaceCoin.connect(user3).burnFrom(owner.address, amountToBurn);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalBalance) - BigInt(amountToBurn)
            );
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(originalBalanceSubmitter);
        });

        it('Test Ethless burn from received amount', async () => {
            await spaceCoin.connect(owner).transfer(user1.address, amountToBurn);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(amountToBurn);
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user2.address);
            await TestHelper.executePermitFlow(provider, spaceCoin, user1, user3, user2, amountToBurn);
            await spaceCoin.connect(user3).burnFrom(user1.address, amountToBurn);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(0);
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(originalBalanceSubmitter);
        });

        it('Test Ethless burn some of the received amount', async () => {
            await spaceCoin.connect(owner).transfer(user1.address, amountToBurn);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(amountToBurn);
            const newAmountToBurn = amountToBurn - 3;
            const originalBalanceSubmitter = await spaceCoin.balanceOf(user2.address);
            await TestHelper.executePermitFlow(provider, spaceCoin, user1, user3, user2, amountToBurn);
            await spaceCoin.connect(user3).burnFrom(user1.address, newAmountToBurn);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(amountToBurn - newAmountToBurn);
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(originalBalanceSubmitter);
        });
    });

    describe('SpaceCoin - Test expecting failure Ethless Burn', async function () {
        const amountToBurn = TestHelper.getRandomIntInRange(10, 200);

        it('Test Ethless burn when there is no permit', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            await expect(
                spaceCoin.connect(user3).burnFrom(owner.address, amountToBurn)
            ).to.be.reverted;

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(BigInt(originalBalance));
        });

        it('Test Ethless self-burning without permit', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            await expect(
                spaceCoin.connect(owner).burnFrom(owner.address, amountToBurn)
            ).to.be.reverted;
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(BigInt(originalBalance));
        });

        it('Test Ethless burn more than permit', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const permitAmount = amountToBurn - 1;
            await TestHelper.executePermitFlow(provider, spaceCoin, owner, user3, user2, permitAmount);
            await expect(
                spaceCoin.connect(user3).burnFrom(owner.address, amountToBurn)
            ).to.be.reverted;
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(BigInt(originalBalance));

            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(permitAmount);
        });

        it('Test Ethless burn multiple time than permit', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const amountAfterBurn = BigInt(originalBalance) - BigInt(amountToBurn);
            await TestHelper.executePermitFlow(provider, spaceCoin, owner, user3, user2, amountToBurn);
            await spaceCoin.connect(user3).burnFrom(owner.address, amountToBurn);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(amountAfterBurn);

            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(0);

            await expect(
                spaceCoin.connect(user3).burnFrom(owner.address, 1)
            ).to.be.reverted;
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(amountAfterBurn);
        });

        it('Test Ethless burn more than approved', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);
            const amountToApprove = amountToBurn - 1;
            await spaceCoin.connect(owner).approve(user3.address, amountToApprove);

            await expect(
                spaceCoin.connect(user3).burnFrom(owner.address, amountToBurn)
            ).to.be.reverted;
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(BigInt(originalBalance));

            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToApprove);
        });
    });
});
