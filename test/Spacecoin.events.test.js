require('dotenv');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const TestHelper = require('./shared');
const SignHelper = require('./signature');

let owner;
let user1;
let user2;
let user3;
let SpaceCoin;
let provider;
const zeroAddress = '0x0000000000000000000000000000000000000000';

describe('SpaceCoin - Events emission', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [SpaceCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('SpaceCoin - Events in link with ERC20 token', async function () {
        const amountToApprove = 100;
        const amountToIncrease = 100;
        const amountToDecrease = 50;
        const amountToTransfer = 100;
        const amountToBurn = 100;

        it('Test approve() emit Approval', async () => {
            const input = await spaceCoin.connect(owner)['approve(address,uint256)'](user1.address, amountToApprove);
            const receipt = await input.wait();
            await expect(input).to.emit(SpaceCoin, 'Approval').withArgs(owner.address, user1.address, amountToApprove);
            expect(receipt.events.length).to.equal(1);
            expect(receipt.events[0].event).to.be.equal('Approval');
        });

        it('Test increaseAllowance() emit Approval', async () => {
            await spaceCoin.connect(owner)['approve(address,uint256)'](user1.address, amountToApprove);
            const input = await spaceCoin.connect(owner)['increaseAllowance(address,uint256)'](
                user1.address,
                amountToIncrease
            );
            const receipt = await input.wait();
            await expect(input)
                .to.emit(SpaceCoin, 'Approval')
                .withArgs(owner.address, user1.address, ethers.BigNumber.from(amountToApprove).add(amountToIncrease));
            expect(receipt.events.length).to.equal(1);
            expect(receipt.events[0].event).to.be.equal('Approval');
        });

        it('Test decreaseAllowance() emit Approval', async () => {
            await spaceCoin.connect(owner)['approve(address,uint256)'](user1.address, amountToApprove);
            const input = await spaceCoin.connect(owner)['decreaseAllowance(address,uint256)'](
                user1.address,
                amountToDecrease
            );
            const receipt = await input.wait();
            await expect(input)
                .to.emit(SpaceCoin, 'Approval')
                .withArgs(owner.address, user1.address, ethers.BigNumber.from(amountToApprove).sub(amountToDecrease));
            expect(receipt.events.length).to.equal(1);
            expect(receipt.events[0].event).to.be.equal('Approval');
        });

        it('Test transfer() emit Transfer', async () => {
            const input = await spaceCoin.connect(owner)['transfer(address,uint256)'](user1.address, amountToTransfer);
            const receipt = await input.wait();
            await expect(input).to.emit(SpaceCoin, 'Transfer').withArgs(owner.address, user1.address, amountToTransfer);
            expect(receipt.events.length).to.equal(1);
            expect(receipt.events[0].event).to.be.equal('Transfer');
        });

        it('Test transferFrom() emit Transfer', async () => {
            const inputApprove = await spaceCoin.connect(owner).populateTransaction.approve(
                user2.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, spaceCoin.address, owner, ethers, provider, 0);

            const input = await spaceCoin.connect(user2)['transferFrom(address,address,uint256)'](
                owner.address,
                user1.address,
                amountToTransfer
            );
            const receipt = await input.wait();
            await expect(input).to.emit(SpaceCoin, 'Approval').withArgs(owner.address, user2.address, 0);
            await expect(input).to.emit(SpaceCoin, 'Transfer').withArgs(owner.address, user1.address, amountToTransfer);
            expect(receipt.events.length).to.equal(2);
            expect(receipt.events[0].event).to.be.equal('Approval');
            expect(receipt.events[1].event).to.be.equal('Transfer');
        });

        it('Test burn() emit Transfer', async () => {
            const input = await spaceCoin.connect(owner)['burn(uint256)'](amountToBurn);
            const receipt = await input.wait();
            await expect(input).to.emit(SpaceCoin, 'Transfer').withArgs(owner.address, zeroAddress, amountToBurn);
            expect(receipt.events.length).to.equal(1);
            expect(receipt.events[0].event).to.be.equal('Transfer');
        });
    });
});
