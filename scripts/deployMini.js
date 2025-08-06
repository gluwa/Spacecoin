const { ethers, network, upgrades, addressBook } = require('hardhat');
const ScriptHelper = require('./helper');
const TestHelper = require('../test/shared');
const owner = "0x7B17116c5C56264a70B956FEC54E3a3736e08Af0";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', network.name);
    console.log('\x1b[32m%s\x1b[0m', 'Account address: ', deployer.address);
    console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', (await deployer.getBalance()).toString());

    // Contract deployed with transparent proxy
    const SpaceCoinContract = await ethers.getContractFactory('SpaceCoin');
    const SpaceCoin = await SpaceCoinContract.deploy(
        owner,
        TestHelper.NAME,
        TestHelper.SYMBOL,
        TestHelper.TOTALSUPPLY
    );
    await spaceCoin.deployed();
    addressBook.saveContract(
        'SpaceCoin',
        spaceCoin.address,
        network.name,
        deployer.address,
        spaceCoin.blockHash,
        spaceCoin.blockNumber
    );
    console.log(
        '\x1b[32m%s\x1b[0m',
        'SpaceCoin deployed at address: ',
        spaceCoin.address
    );
  
    console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', (await deployer.getBalance()).toString());

    console.log('Contract deployed!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
