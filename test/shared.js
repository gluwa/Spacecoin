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
const ETHLESS_TRANSFER_SIGNATURE = 'transferBySignature(address,address,uint256,uint256,uint8,bytes32,bytes32)';

let skipInitializeContracts = false;

// LogLevel 0: No logs, 1: Recap of expected rewards, 2: full by block expected rewards math
if (process.env.LOGLEVEL == undefined) process.env.LOGLEVEL = 0;

const getRandomIntInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
    const owner = new ethers.Wallet(
        ethers.Wallet.fromPhrase(network.config.accounts.mnemonic, `m/44'/60'/0'/0/0`).privateKey,
        provider
    );
    const user1 = new ethers.Wallet(
        ethers.Wallet.fromPhrase(network.config.accounts.mnemonic, `m/44'/60'/0'/0/1`).privateKey,
        provider
    );
    const user2 = new ethers.Wallet(
        ethers.Wallet.fromPhrase(network.config.accounts.mnemonic, `m/44'/60'/0'/0/2`).privateKey,
        provider
    );
    const user3 = new ethers.Wallet(
        ethers.Wallet.fromPhrase(network.config.accounts.mnemonic, `m/44'/60'/0'/0/3`).privateKey,
        provider
    );
    return [provider, owner, user1, user2, user3];
};

const setupContractTesting = async (owner) => {
    if (network.name !== 'hardhat') {
        initialBlockGATE = await ethers.provider.getBlockNumber();
    }
    const FactorySpaceCoin = await ethers.getContractFactory('SpaceCoin');
    let SpaceCoin;
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
        nonce: ethers.utils.hexlify(txCount),
        to: to,
        value: 0x00,
        gasLimit: ethers.utils.hexlify(3000000),
        gasPrice: network.name !== 'kaleido' ? ethers.utils.hexlify(25000000000) : ethers.utils.hexlify(0),
        data: input.data
    };
    const hash = await sender.signTransaction(rawTx);
    return await provider.waitForTransaction(hash);
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

const executePermitFlow = async (provider, SpaceCoin, owner, spender, submitter, amountToPermit) => {
    const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), spaceCoin.nonces(owner.address)]);

    const block = await provider.getBlock(blockNumber);
    const expirationTimestamp = block.timestamp + 20000;

    // Generate signature
    const splitSignature = await SignHelper.signPermit(
        NAME,
        VERSION_712,
        spaceCoin.address,
        owner,
        spender.address,
        amountToPermit,
        nonce.toNumber(),
        expirationTimestamp
    );

    // Prepare the transaction input
    const input = await spaceCoin.populateTransaction.permit(
        owner.address,
        spender.address,
        amountToPermit,
        expirationTimestamp,
        splitSignature.v,
        splitSignature.r,
        splitSignature.s
    );

    await submitTxnAndCheckResult(input, spaceCoin.address, submitter, ethers, provider, 0);
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
    // FUNCTIONS
    setupProviderAndWallet,
    setupContractTesting,
    txn,
    submitTxnAndCheckResult,
    waitForNumberOfBlock,
    executePermitFlow,
    getRandomIntInRange
};
