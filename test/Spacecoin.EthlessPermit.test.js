require('dotenv');
const { expect } = require('chai');
const { ethers, network } = require('hardhat');
const TestHelper = require('../shared/helper');
const SignHelper = require('../shared/signature');

let owner;
let user1;
let user2;
let user3;
let spaceCoin;
let provider;

describe('SpaceCoin - Ethless Permit functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [spaceCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('SpaceCoin - Regular Ethless Permit', async function () {
        const amountToPermit = 100;
        const amountToTransfer = 80;

        it('Test Ethless Permit', async () => {
            const amountToPermit = TestHelper.getRandomIntInRange(10, 200);
            await TestHelper.executePermitFlow(provider, spaceCoin, owner, user3, user2, amountToPermit);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToPermit);
        });

        it('Test Ethless Permit can override approve', async () => {
            const amountToPermit0 = TestHelper.getRandomIntInRange(10, 200);
            await spaceCoin.approve(user2.address, amountToPermit0);
            const amountToPermit = amountToPermit0 - 10;
            await TestHelper.executePermitFlow(provider, spaceCoin, owner, user3, user2, amountToPermit);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToPermit);
        });

        it('Test Ethless Permit can be overridden by approve', async () => {
            const amountToPermit0 = TestHelper.getRandomIntInRange(10, 200);
            await TestHelper.executePermitFlow(provider, spaceCoin, owner, user3, user2, amountToPermit0);
            const amountToPermit = amountToPermit0 - 10;
            await spaceCoin.connect(owner).approve(user3.address, amountToPermit);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToPermit);
        });

        it('Test Ethless Permit & transferFrom', async () => {
            const amountToPermit = TestHelper.getRandomIntInRange(10, 200);
            await TestHelper.executePermitFlow(provider, spaceCoin, owner, user3, user2, amountToPermit);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToPermit);

            const originalOwnerBalance = await spaceCoin.balanceOf(owner.address);
            const originalUser1Balance = await spaceCoin.balanceOf(user1.address);

            await spaceCoin.connect(user3).transferFrom(
                owner.address,
                user1.address,
                amountToPermit
            );
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalOwnerBalance) - BigInt(amountToPermit)
            );
            expect((await spaceCoin.balanceOf(user1.address)).toString()).to.equal(
                BigInt(originalUser1Balance) + BigInt(amountToPermit)
            );
        });
    });

    describe('SpaceCoin - Test expecting failure Ethless Permit', async function () {

        it('Test Ethless Permit while reusing the same nonce (and signature) on the second permit', async () => {
            const amountToPermit = TestHelper.getRandomIntInRange(10, 200);
            await TestHelper.executePermitFlow(provider, spaceCoin, owner, user3, user2, amountToPermit);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToPermit);

            const originalOwnerBalance = await spaceCoin.balanceOf(owner.address);
            const originalUser1Balance = await spaceCoin.balanceOf(user1.address);

            await TestHelper.executePermitFlow(provider, spaceCoin, owner, user3, user2, amountToPermit);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToPermit);

            await spaceCoin.connect(user3).transferFrom(
                owner.address,
                user1.address,
                amountToPermit
            );
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalOwnerBalance) - BigInt(amountToPermit)
            );
            expect((await spaceCoin.balanceOf(user1.address)).toString()).to.equal(
                BigInt(originalUser1Balance) + BigInt(amountToPermit)
            );
        });

        it('Test Ethless Permit & 2x transferFrom, the second one should fail as it will be higher than the remaining allowance', async () => {
            const amountToPermit = TestHelper.getRandomIntInRange(10, 200);
            await TestHelper.executePermitFlow(provider, spaceCoin, owner, user3, user2, amountToPermit);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToPermit);

            const originalOwnerBalance = await spaceCoin.balanceOf(owner.address);
            const originalUser1Balance = await spaceCoin.balanceOf(user1.address);

            await TestHelper.executePermitFlow(provider, spaceCoin, owner, user3, user2, amountToPermit);
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(amountToPermit);

            await spaceCoin.connect(user3).transferFrom(
                owner.address,
                user1.address,
                amountToPermit
            );
            expect(await spaceCoin.allowance(owner.address, user3.address)).to.equal(0);
            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalOwnerBalance) - BigInt(amountToPermit)
            );
            expect((await spaceCoin.balanceOf(user1.address)).toString()).to.equal(
                BigInt(originalUser1Balance) + BigInt(amountToPermit)
            );
        });
    });
});
