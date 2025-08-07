require('dotenv');
const { expect } = require('chai');
const { ethers, network } = require('hardhat');
const TestHelper = require('../shared/helper');
const SignHelper = require('../shared/signature');

let owner;
let user1;
let user2;
let user3;
let SpaceCoin;
let provider;

describe('SpaceCoin - Ethless Permit functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [SpaceCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('SpaceCoin - Regular Ethless Permit', async function () {
        const amountToPermit = 100;
        const amountToTransfer = 80;

        it('Test Ethless Permit', async () => {
            const blockNumber = await provider.getBlockNumber();
            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const nonce = await spaceCoin.nonces(owner.address);

            const splitSignature = await SignHelper.signPermit(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                spaceCoin.address,
                owner,
                user2.address,
                amountToPermit,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await spaceCoin.populateTransaction.permit(
                owner.address,
                user2.address,
                amountToPermit,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect((await spaceCoin.allowance(owner.address, user2.address)).toString()).to.equal(
                amountToPermit.toString()
            );
        });

        it('Test Ethless Permit can override approve', async () => {
            const amountToApprove = amountToPermit - 3;
            const input0 = await spaceCoin.populateTransaction.approve(user2.address, amountToApprove);
            await TestHelper.submitTxnAndCheckResult(input0, spaceCoin.address, owner, ethers, provider, 0);
            expect((await spaceCoin.allowance(owner.address, user2.address)).toString()).to.equal(
                amountToApprove.toString()
            );

            const blockNumber = await provider.getBlockNumber();
            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const nonce = await spaceCoin.nonces(owner.address);

            const splitSignature = await SignHelper.signPermit(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                spaceCoin.address,
                owner,
                user2.address,
                amountToPermit,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await spaceCoin.populateTransaction.permit(
                owner.address,
                user2.address,
                amountToPermit,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect((await spaceCoin.allowance(owner.address, user2.address)).toString()).to.equal(
                amountToPermit.toString()
            );
        });

        it('Test Ethless Permit can be overridden by approve', async () => {
            const blockNumber = await provider.getBlockNumber();
            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const nonce = await spaceCoin.nonces(owner.address);

            const splitSignature = await SignHelper.signPermit(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                spaceCoin.address,
                owner,
                user2.address,
                amountToPermit,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await spaceCoin.populateTransaction.permit(
                owner.address,
                user2.address,
                amountToPermit,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect((await spaceCoin.allowance(owner.address, user2.address)).toString()).to.equal(
                amountToPermit.toString()
            );

            const amountToApprove = amountToPermit - 9;
            const input0 = await spaceCoin.populateTransaction.approve(user2.address, amountToApprove);
            await TestHelper.submitTxnAndCheckResult(input0, spaceCoin.address, owner, ethers, provider, 0);
            expect((await spaceCoin.allowance(owner.address, user2.address)).toString()).to.equal(
                amountToApprove.toString()
            );
        });

        it('Test Ethless Permit & transferFrom', async () => {
            const blockNumber = await provider.getBlockNumber();
            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const nonce = await spaceCoin.nonces(owner.address);

            const splitSignature = await SignHelper.signPermit(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                spaceCoin.address,
                owner,
                user2.address,
                amountToPermit,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await spaceCoin.populateTransaction.permit(
                owner.address,
                user2.address,
                amountToPermit,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );

            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect((await spaceCoin.allowance(owner.address, user2.address)).toString()).to.equal(
                amountToPermit.toString()
            );

            const originalOwnerBalance = await spaceCoin.balanceOf(owner.address);
            const originalUser1Balance = await spaceCoin.balanceOf(user1.address);

            const inputTransferFrom = await spaceCoin.connect(user2).populateTransaction.transferFrom(
                owner.address,
                user1.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputTransferFrom, spaceCoin.address, user2, ethers, provider, 0);

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalOwnerBalance).sub(amountToTransfer)
            );
            expect((await spaceCoin.balanceOf(user1.address)).toString()).to.equal(
                ethers.BigNumber.from(originalUser1Balance).add(amountToTransfer)
            );
        });
    });

    describe('SpaceCoin - Test expecting failure Ethless Permit', async function () {
        const amountToPermit = 100;
        const amountToTransfer = 80;

        it('Test Ethless Permit while reusing the same nonce (and signature) on the second permit', async () => {
            const blockNumber = await provider.getBlockNumber();
            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const nonce = await spaceCoin.nonces(owner.address);

            const signature = await owner._signTypedData(
                {
                    name: TestHelper.NAME,
                    version: TestHelper.VERSION_712,
                    chainId: network.config.chainId,
                    verifyingContract: spaceCoin.address
                },
                {
                    // Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)
                    Permit: [
                        {
                            name: 'owner',
                            type: 'address'
                        },
                        {
                            name: 'spender',
                            type: 'address'
                        },
                        {
                            name: 'value',
                            type: 'uint256'
                        },
                        {
                            name: 'nonce',
                            type: 'uint256'
                        },
                        {
                            name: 'deadline',
                            type: 'uint256'
                        }
                    ]
                },
                {
                    owner: owner.address,
                    spender: user2.address,
                    value: amountToPermit,
                    nonce: nonce,
                    deadline: expirationTimestamp
                }
            );
            const splitSignature = ethers.utils.splitSignature(signature);
            const input = await spaceCoin.populateTransaction.permit(
                owner.address,
                user2.address,
                amountToPermit,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect((await spaceCoin.allowance(owner.address, user2.address)).toString()).to.equal(
                amountToPermit.toString()
            );
            await TestHelper.submitTxnAndCheckResult(
                input,
                spaceCoin.address,
                user3,
                ethers,
                provider,
                'ERC20Permit: invalid signature'
            );
        });

        it('Test Ethless Permit & 2x transferFrom, the second one should fail as it will be higher than the remaining allowance', async () => {
            const blockNumber = await provider.getBlockNumber();
            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const nonce = await spaceCoin.nonces(owner.address);

            const signature = await owner._signTypedData(
                {
                    name: TestHelper.NAME,
                    version: TestHelper.VERSION_712,
                    chainId: network.config.chainId,
                    verifyingContract: spaceCoin.address
                },
                {
                    // Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)
                    Permit: [
                        {
                            name: 'owner',
                            type: 'address'
                        },
                        {
                            name: 'spender',
                            type: 'address'
                        },
                        {
                            name: 'value',
                            type: 'uint256'
                        },
                        {
                            name: 'nonce',
                            type: 'uint256'
                        },
                        {
                            name: 'deadline',
                            type: 'uint256'
                        }
                    ]
                },
                {
                    owner: owner.address,
                    spender: user2.address,
                    value: amountToPermit,
                    nonce: nonce,
                    deadline: expirationTimestamp
                }
            );
            const splitSignature = ethers.utils.splitSignature(signature);
            const input = await spaceCoin.populateTransaction.permit(
                owner.address,
                user2.address,
                amountToPermit,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );
            await TestHelper.submitTxnAndCheckResult(input, spaceCoin.address, user3, ethers, provider, 0);
            expect((await spaceCoin.allowance(owner.address, user2.address)).toString()).to.equal(
                amountToPermit.toString()
            );

            const originalOwnerBalance = await spaceCoin.balanceOf(owner.address);
            const originalUser1Balance = await spaceCoin.balanceOf(user1.address);

            const inputTransferFrom = await spaceCoin.connect(user2).populateTransaction.transferFrom(
                owner.address,
                user1.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputTransferFrom, spaceCoin.address, user2, ethers, provider, 0);

            expect(await spaceCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalOwnerBalance).sub(amountToTransfer)
            );
            expect((await spaceCoin.balanceOf(user1.address)).toString()).to.equal(
                ethers.BigNumber.from(originalUser1Balance).add(amountToTransfer)
            );

            const inputTransferFrom2 = await spaceCoin.connect(user2).populateTransaction.transferFrom(
                owner.address,
                user1.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(
                inputTransferFrom2,
                spaceCoin.address,
                user2,
                ethers,
                provider,
                'ERC20: insufficient allowance'
            );
        });
    });
});
