require('dotenv').config({ path: __dirname + '/.env.development' });
const { ethers, network, addressBook } = require('hardhat');
const { expect } = require('chai');
const SignHelper = require('./signature');

const NAME = 'Spacecoin';
const SYMBOL = 'SPC';
const DECIMALS = 18;
const TOTALSUPPLY = ethers.parseUnits('100000000000', DECIMALS);
const VERSION = '1';
const VERSION_712 = '1';

const STANDARD_MINT_AMOUNT = ethers.parseEther('1000');
const ETHLESS_TRANSFER_SIGNATURE = 'transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)';

const ErrorMessages = {
    INSUFFICIENT_BALANCE_CODE: 'ERC20InsufficientBalance',
    INSUFFICIENT_ALLOWANCE_CODE: 'ERC20InsufficientAllowance',
    INVALID_ARGUMENT_CODE: 'INVALID_ARGUMENT'
};

let skipInitializeContracts = false;

// LogLevel 0: No logs, 1: Recap of expected rewards, 2: full by block expected rewards math
if (process.env.LOGLEVEL == undefined) process.env.LOGLEVEL = 0;

const getRandomIntInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateNonce = () => {
    return '0x' + require('crypto').randomBytes(32).toString('hex');
};

const setupProviderAndWallet = async () => {
    let provider;
    if (network.name === 'hardhat') {
        provider = ethers.provider;
    } else if (network.name === 'kaleido') {
        const rpcUrl = {
            url: `https://${process.env.RPC_KALEIDO_ENDPOINT}`,
            user: process.env.RPC_KALEIDO_USER,
            password: process.env.RPC_KALEIDO_PASS
        };
        provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    } else {
        provider = new ethers.providers.JsonRpcProvider(network.config.url);
    }
    const [owner, user1, user2, user3] = await ethers.getSigners();
    return [provider, owner, user1, user2, user3];
};

const setupContractTesting = async (owner) => {
    if (network.name !== 'hardhat') {
        initialBlockGATE = await ethers.provider.getBlockNumber();
    }
    const FactorySpaceCoin = await ethers.getContractFactory('SpaceCoin');
    let spaceCoin;
    if (network.name === 'hardhat') {
        spaceCoin = await FactorySpaceCoin.deploy(await owner.getAddress(), NAME, SYMBOL, TOTALSUPPLY);

        await spaceCoin.waitForDeployment();
    } else {
        const SpaceCoinAddress = await addressBook.retrieveContract('SpaceCoin', network.name);

        spaceCoin = await new ethers.Contract(SpaceCoinAddress, FactorySpaceCoin.interface, await owner.getAddress());
        if (!skipInitializeContracts) {
            try {
                await spaceCoin.name();
            } catch (e) {
                await spaceCoin.initialize(await owner.getAddress(), NAME, SYMBOL, TOTALSUPPLY);
            }
        }
    }
    return [spaceCoin];
};

const txn = async (input, to, sender, ethers, provider) => {
    const txCount = await provider.getTransactionCount(await sender.getAddress());
    const rawTx = {
        chainId: network.config.chainId,
        nonce: txCount,
        to: to,
        value: 0x00,
        gasLimit: 3000000,
        gasPrice: network.name !== 'kaleido' ? 25000000000 : 0,
        data: input.data
    };
    const tx = await sender.sendTransaction(rawTx);
    return await tx.wait();
};

const submitTxnAndCheckResult = async (input, to, from, ethers, provider, errMsg) => {
    if (network.name === 'hardhat') {
        if (errMsg) {
            await expect(txn(input, to, from, ethers, provider)).to.be.revertedWith(errMsg);
        } else {
            result = await txn(input, to, from, ethers, provider);
            expect(result.status).to.equal(1 || errMsg);
        }
    } else {
        if (errMsg) {
            result = await txn(input, to, from, ethers, provider);
            expect(result.status).to.equal(0);
        } else {
            result = await txn(input, to, from, ethers, provider);
            expect(result.status).to.equal(1 || errMsg);
        }
    }
};

const waitForNumberOfBlock = async (provider, numberOfBlock) => {
    const currentBlock = await provider.getBlockNumber();
    let temp = await provider.getBlockNumber();
    while (temp < currentBlock + numberOfBlock) {
        if (network.name === 'hardhat') {
            // Mine 1 block
            await provider.send('evm_mine');
        } else {
            // wait 15 seconds
            await new Promise((resolve) => setTimeout(resolve, 15000));
        }
        temp = await provider.getBlockNumber();
    }
};

const executePermitFlow = async (provider, spaceCoin, owner, spender, submitter, amountToPermit) => {
    const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), spaceCoin.nonces(owner.address)]);

    const block = await provider.getBlock(blockNumber);
    const expirationTimestamp = block.timestamp + 20000;

    // Generate signature
    const splitSignature = await SignHelper.signPermit(
        NAME,
        VERSION_712,
        await spaceCoin.getAddress(),
        owner,
        await spender.getAddress(),
        amountToPermit,
        nonce,
        expirationTimestamp
    );
    await spaceCoin.connect(submitter).permit(
        await owner.getAddress(),
        await spender.getAddress(),
        amountToPermit,
        expirationTimestamp,
        splitSignature.v,
        splitSignature.r,
        splitSignature.s
    );
};

module.exports = {
    // CONSTANTS
    NAME,
    SYMBOL,
    DECIMALS,
    TOTALSUPPLY,
    VERSION,
    VERSION_712,
    STANDARD_MINT_AMOUNT,
    ETHLESS_TRANSFER_SIGNATURE,
    ErrorMessages,
    // FUNCTIONS
    setupProviderAndWallet,
    setupContractTesting,
    txn,
    submitTxnAndCheckResult,
    waitForNumberOfBlock,
    executePermitFlow,
    getRandomIntInRange,
    generateNonce
};
