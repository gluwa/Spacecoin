const { ethers, network, upgrades, addressBook } = require('hardhat');

//  npx hardhat verify --network cc3_testnet 0xcd3cA90862e470e2058e91EC905C9188328af16F 0x7B17116c5C56264a70B956FEC54E3a3736e08Af0 SpaceCoin-Test SPC-Test 21000000000000000000000000000
async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', network.name);
    console.log('\x1b[32m%s\x1b[0m', 'Account address: ', deployer.address);
    console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', await ethers.provider.getBalance(deployer.address));

    const owner = "0x7B17116c5C56264a70B956FEC54E3a3736e08Af0";

    const name = "Spacecoin-Test";
    const symbol = "SPACE-Test";
    const totalSupply = 21000000000000000000000000000n; // target issuance of Spacecoin

    
    // Contract deployed with transparent proxy
    const SpaceCoinContract = await ethers.getContractFactory('SpaceCoin');
    const spaceCoin = await SpaceCoinContract.deploy(
        owner,
        name,
        symbol,
        totalSupply
    );
    await spaceCoin.waitForDeployment();
  
    console.log(
        '\x1b[32m%s\x1b[0m',
        'SpaceCoin deployed at address: ',
        spaceCoin.target
    );
  
    console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', await ethers.provider.getBalance(deployer.address));

    console.log('Contract deployed!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
