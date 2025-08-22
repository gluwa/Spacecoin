const { ethers, network } = require('hardhat');
const TestHelper = require('../shared/helper');

async function main() {
    const [deployer] = await ethers.getSigners();
 
    console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', network.name);
    console.log('\x1b[32m%s\x1b[0m', 'Account address: ', deployer.address);
    console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', (await ethers.provider.getBalance(deployer.address)).toString());

    // Contract deployed with transparent proxy
    const SpaceCoinContract = await ethers.getContractFactory('SpaceCoin');
    const spaceCoin = await SpaceCoinContract.deploy(
        deployer.address,
        TestHelper.NAME,
        TestHelper.SYMBOL,
        TestHelper.TOTALSUPPLY
    );
    await spaceCoin.waitForDeployment();

    console.log(
        '\x1b[32m%s\x1b[0m',
        'SpaceCoin deployed at address: ',
        await spaceCoin.getAddress()
    );
    console.log('Spacecoin balance of deployer: ', await spaceCoin.balanceOf(deployer.address));
    console.log('Contract deployed!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
