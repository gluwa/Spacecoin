require('dotenv');
const { expect } = require('chai');
const TestHelper = require('../shared/helper');

let owner;
let user1;
let user2;
let user3;
let spaceCoin;
let provider;
const zeroAddress = '0x0000000000000000000000000000000000000000';

describe('SpaceCoin - Events emission', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [spaceCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('SpaceCoin - Events in link with ERC20 token', async function () {
        const amountToApprove = 100;
        const amountToTransfer = 100;
        const amountToBurn = 100;

        it('Test approve() emit Approval', async () => {
            const tx = await spaceCoin.connect(owner).approve(user1.address, amountToApprove);
            await expect(tx).to.emit(spaceCoin, 'Approval').withArgs(owner.address, user1.address, amountToApprove);
        });

        it('Test transfer() emit Transfer', async () => {
            const tx = await spaceCoin.connect(owner).transfer(user1.address, amountToTransfer);
            await expect(tx).to.emit(spaceCoin, 'Transfer').withArgs(owner.address, user1.address, amountToTransfer);
        });

        it('Test transferFrom() emit Transfer', async () => {
            await spaceCoin.connect(owner).approve(user2.address, amountToTransfer);

            const tx = await spaceCoin.connect(user2).transferFrom(
                owner.address,
                user1.address,
                amountToTransfer
            );
            await expect(tx).to.emit(spaceCoin, 'Transfer').withArgs(owner.address, user1.address, amountToTransfer);
        });

        it('Test burn() emit Transfer', async () => {
            const tx = await spaceCoin.connect(owner).burn(amountToBurn);
            await expect(tx).to.emit(spaceCoin, 'Transfer').withArgs(owner.address, zeroAddress, amountToBurn);
        });


    });
});
