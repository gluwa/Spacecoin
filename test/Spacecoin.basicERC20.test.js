require('dotenv');
const { expect } = require('chai');
const TestHelper = require('../shared/helper');

let owner;
let user1;
let user2;
let user3;
let spaceCoin;
let provider;

describe('SpaceCoin - Basic ERC20 functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [spaceCoin] = await TestHelper.setupContractTesting(owner);
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

        beforeEach(async () => {
            const amountToTransfer = 100;
            await spaceCoin.connect(owner).transfer(user1.address, amountToTransfer);
        });
        it('Test approve()', async () => {
            await spaceCoin.connect(user1).approve(user2.address, amountToApprove);
            expect((await spaceCoin.allowance(user1.address, user2.address)).toString()).to.equal(
                amountToApprove.toString()
            );
        });
    });

    describe('SpaceCoin - transfer and transferFrom', async function () {
        const amountToTransfer = 100;

        it('Test transfer() / verify balanceOf owner is -1000', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            await spaceCoin.connect(owner).transfer(user2.address, amountToTransfer);

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalBalance) - BigInt(amountToTransfer)
            );
            expect(await spaceCoin.balanceOf(user2.address)).to.equal(BigInt(amountToTransfer));
        });

        it('Test transferFrom() / verify balance of owner is -1000', async () => {
            const originalOwnerBalance = await spaceCoin.balanceOf(owner.address);
            const originalUser2Balance = await spaceCoin.balanceOf(user2.address);

            await spaceCoin.connect(owner).approve(user1.address, amountToTransfer);

            await spaceCoin.connect(user1).transferFrom(
                owner.address,
                user2.address,
                amountToTransfer
            );

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalOwnerBalance) - BigInt(amountToTransfer)
            );
            expect((await spaceCoin.balanceOf(user2.address)).toString()).to.equal(
                BigInt(originalUser2Balance) + BigInt(amountToTransfer)
            );
        });
    });

    describe('SpaceCoin - burn', async function () {
        const amountToBurn = 100;

        it('Test burn() / verify balanceOf owner is -100', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            await spaceCoin.connect(owner).burn(amountToBurn);

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalBalance) - BigInt(amountToBurn)
            );
        });
    });

    describe('SpaceCoin - Test expecting failure transfer and transferFrom', async function () {
        const amountToTransfer = 100;

        it('Test transfer() without balance', async () => {
            const originalUser1Balance = await spaceCoin.balanceOf(user1.address);

            await expect(spaceCoin.connect(user1).transfer(user2.address, amountToTransfer)).to.be.revertedWithCustomError(spaceCoin, TestHelper.ErrorMessages.INSUFFICIENT_BALANCE_CODE);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(BigInt(originalUser1Balance));
        });

        it('Test transferFrom() without allowance', async () => {
            const originalUser1Balance = await spaceCoin.balanceOf(user1.address);
            const originalUser3Balance = await spaceCoin.balanceOf(user3.address);

            await expect(spaceCoin.connect(user1).transferFrom(
                user1.address,
                user3.address,
                amountToTransfer
            )).to.be.revertedWithCustomError(spaceCoin, TestHelper.ErrorMessages.INSUFFICIENT_ALLOWANCE_CODE);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(BigInt(originalUser1Balance));
            expect(await spaceCoin.balanceOf(user3.address)).to.equal(BigInt(originalUser3Balance));
        });

        it('Test transferFrom() without balance', async () => {
            const originalUser1Balance = await spaceCoin.balanceOf(user1.address);
            const originalUser3Balance = await spaceCoin.balanceOf(user3.address);

            await spaceCoin.connect(user1).approve(user2.address, amountToTransfer);

            await expect(spaceCoin.connect(user2).transferFrom(
                user1.address,
                user3.address,
                amountToTransfer
            )).to.be.revertedWithCustomError(spaceCoin, TestHelper.ErrorMessages.INSUFFICIENT_BALANCE_CODE);
            expect(await spaceCoin.balanceOf(user1.address)).to.equal(BigInt(originalUser1Balance));
            expect(await spaceCoin.balanceOf(user3.address)).to.equal(BigInt(originalUser3Balance));
        });

        it('Test 2x transferFrom() second transferFrom will fail due to remaining allowance to low', async () => {
            const originalOwnerBalance = await spaceCoin.balanceOf(owner.address);
            const originalUser2Balance = await spaceCoin.balanceOf(user2.address);

            await spaceCoin.connect(owner).approve(user1.address, amountToTransfer);

            await spaceCoin.connect(user1).transferFrom(
                owner.address,
                user2.address,
                amountToTransfer
            );

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                BigInt(originalOwnerBalance) - BigInt(amountToTransfer)
            );
            expect((await spaceCoin.balanceOf(user2.address)).toString()).to.equal(
                BigInt(originalUser2Balance) + BigInt(amountToTransfer)
            );

            await expect(spaceCoin.connect(user1).transferFrom(
                owner.address,
                user2.address,
                amountToTransfer
            )).to.be.revertedWithCustomError(spaceCoin, TestHelper.ErrorMessages.INSUFFICIENT_ALLOWANCE_CODE);
        });
    });

    describe('SpaceCoin - Test expecting failure burn', async function () {
        const amountToBurn = 100;

        it('Test burn() without balance', async () => {
            const originalBalance = await spaceCoin.balanceOf(owner.address);

            await expect(spaceCoin.connect(user1).burn(amountToBurn)).to.be.revertedWithCustomError(spaceCoin, TestHelper.ErrorMessages.INSUFFICIENT_BALANCE_CODE);

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(BigInt(originalBalance));
        });
    });
});
