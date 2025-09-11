import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { ethers } from "ethers";
import { SpaceCoin__factory, SpaceCoin } from "../typechain-types";  // adjust import path

const RPC_URL = process.env.SEPOLIA_RPC_URL; // process.env.SEPOLIA_RPC_URL process.env.CC3_TESTNET_RPC_URL
const ERC20_ADDRESS = "0xB3a90d0708D28996cDfFB0cE5fDF9F4c00E6Aa13"; 

const RECIPIENTS = [
  "0x571181C59a6b7625CF49aC40E95E2c293F50fD4e",
  "0xfFE4FE684Fb3821bcDf5AFBdFa808382A4b0b6ed",
  "0x557680a969696447Ffb1485C00D415C2d4Ee747E",
  "0xbD95a865D167Fd89961Ab202CfB4E055249b77Eb",
  "0x440E4d7EC52B0a5Ec588514671357Bb9C6735b0F",
  "0xc99Eb5743646a98Fe12B75e5e82BBB0cFDE7Edab",
  "0x7928CD22f9d277C72156618021e028d5E229F5e0",
  "0x0EA378CA79f0082cd900310B082b38888A2130b0",
  "0x671aa08e7d493EAff9926F9949d1bd2884F1a0d1",
  "0xF2b5Af6C71c1A343F4E1E2ae33da2681B6Ca6E5d",
  "0x48c95Fe7eF2aEAbD63C8723DFdAbdC660E88d62a",
  "0x05fD420Cdec2982c8C5FEE1944717D067d40A67c",
  "0x24B92b7f3129eDCd4c0DDb3ea081E0B64C1F6EE1",
  "0x4A24BE72C01F280E68b6EE9bC91f6677ad4f075A",
  "0x2912Aa6d15DF1eA22997b4aF4AC7d768d2DdB29E",
  "0x5F11740e7854b156d879902840e2D753188C0b89",
  "0x307bd53793F74a2275950E0336ab4c60b412D3dd",
  "0x6BeAED5Be5C2296e66dbBcd6c68011CF80ae1808",
  "0x826bb0bDA61559b6CAA0915Bff666D84208eA02C",
  "0x5EaD4f6d15Dff5889576ba37D9C9670474a5413a",
  "0x451CB4F82bA488E7232E0b19502Fb6F8602134C4",
  "0x2be976b64c238cf2e60297061fd136f384483af3",
  "0xc8AF81a541F2ef914125741c834648330Ce10647",
  "0x31bc2b42462e99ba1f57b32c8d31d841569e2d95",
  "0x18092dfe5a2cd16cf89c4f280759d02fdf95358e",
  "0x2BE976B64c238Cf2E60297061fD136f384483aF3", 
  "0x8e761C038d4B70F41Dc4D89bCB7548dEEEf58355",
  "0xDcF9D8b941e5183316Ffba3315Fc95668481329A",
  "0x1f28A024ef5Fc1f39bF8883d1a458B83a0f370f4",
  "0x0F80aF65162E8d855Ec91f60Bb03016ad52eefd3"
];

const STAKING_ADDRESS = "0x01BD109532d651DD9a0BF92C2658E8cB94081c1d"

const STAKING_ABI = [{"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"address","name":"_operator","type":"address"},{"internalType":"uint32","name":"_interestRate","type":"uint32"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"AccountIsLocked","type":"error"},{"inputs":[],"name":"InvalidStakingAmount","type":"error"},{"inputs":[],"name":"InvalidUnstakeAmount","type":"error"},{"inputs":[],"name":"NothingToClaim","type":"error"},{"inputs":[],"name":"OnlyOperator","type":"error"},{"inputs":[],"name":"StakingNotAllowed","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"oldAllowedStakingStatus","type":"bool"},{"indexed":false,"internalType":"bool","name":"newAllowedStakingStatus","type":"bool"}],"name":"AllowedStakingStatusChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"oldInterst","type":"uint64"},{"indexed":false,"internalType":"uint64","name":"newInterest","type":"uint64"}],"name":"InterestChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"bool","name":"isLocked","type":"bool"}],"name":"LockOrUnlockedAccount","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"oldRewardGenerationStatus","type":"bool"},{"indexed":false,"internalType":"bool","name":"newRewardGenerationStatus","type":"bool"}],"name":"RewardGenerationStatusChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint64","name":"startOn","type":"uint64"}],"name":"Staked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"oldStakingPeriod","type":"uint64"},{"indexed":false,"internalType":"uint64","name":"newStakingPeriod","type":"uint64"}],"name":"StakingPeriodChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint128","name":"amount","type":"uint128"},{"indexed":false,"internalType":"uint64","name":"startOn","type":"uint64"},{"indexed":false,"internalType":"uint64","name":"availableOn","type":"uint64"}],"name":"Unstaked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint128","name":"amount","type":"uint128"},{"indexed":false,"internalType":"uint64","name":"claimedAt","type":"uint64"}],"name":"UnstakedClaimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"oldUnstakingPeriod","type":"uint64"},{"indexed":false,"internalType":"uint64","name":"newUnstakingPeriod","type":"uint64"}],"name":"UnstakingPeriodChanged","type":"event"},{"inputs":[],"name":"RATE_DENOMINATOR","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"RECOVERY_TIMELOCK","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"allowedStakingStatus","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claimReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint16","name":"limit","type":"uint16"}],"name":"claimUnstakedAmount","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"owners","type":"address[]"},{"internalType":"uint16","name":"limit","type":"uint16"}],"name":"claimUnstakedAmountForUsers","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"completedUnstakedAmountsByOwner","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"uint64[]","name":"claimedAts","type":"uint64[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"currentInterestRateInfo","outputs":[{"internalType":"uint32","name":"currentInterestRate","type":"uint32"},{"internalType":"uint64","name":"currentIterestChangedTime","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getStakeConfig","outputs":[{"internalType":"uint32","name":"","type":"uint32"},{"internalType":"uint64","name":"","type":"uint64"},{"internalType":"uint64","name":"","type":"uint64"},{"internalType":"bool","name":"","type":"bool"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint16","name":"","type":"uint16"}],"name":"interestChangedTime","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"interestRates","outputs":[{"internalType":"uint32","name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"bool","name":"lockStatus","type":"bool"}],"name":"lockOrUnlockAccount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"operator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"pendingUnstakedAmountsByOwner","outputs":[{"internalType":"uint128[]","name":"amounts","type":"uint128[]"},{"internalType":"uint64[]","name":"availableOns","type":"uint64[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"recoverUnclaimedToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"rewardGenerationStatus","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"stake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"stakeInfo","outputs":[{"internalType":"uint256","name":"stakedAmount","type":"uint256"},{"internalType":"uint256","name":"totalDebt","type":"uint256"},{"internalType":"uint128","name":"totalEarningForUnstake","type":"uint128"},{"internalType":"uint64","name":"firstStakeTimestamp","type":"uint64"},{"internalType":"uint128","name":"totalClaimedReward","type":"uint128"},{"internalType":"bool","name":"isLocked","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"amountToApprove","type":"uint256"},{"internalType":"uint256","name":"amountToStake","type":"uint256"},{"internalType":"uint256","name":"permitDeadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"stakeWithPermit","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"stakingPeriod","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"stakingReward","outputs":[{"internalType":"uint256","name":"principal","type":"uint256"},{"internalType":"uint128","name":"reward","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalStaked","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint128","name":"amount","type":"uint128"}],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unstakingPeriod","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bool","name":"_allowedStakingStatus","type":"bool"}],"name":"updateAllowedStakingStatus","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint32","name":"_interestRate","type":"uint32"}],"name":"updateInterestRate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"_rewardGenerationStatus","type":"bool"}],"name":"updateRewardGenerationStatus","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint64","name":"_stakingPeriod","type":"uint64"}],"name":"updateStakingPeriod","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint64","name":"_unstakingPeriod","type":"uint64"}],"name":"updateUnstakingPeriod","outputs":[],"stateMutability":"nonpayable","type":"function"}];


async function main() {

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
    const token: SpaceCoin = SpaceCoin__factory.connect(ERC20_ADDRESS, wallet);

    // const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, wallet);
    // await staking.updateUnstakingPeriod(60);
    // return;

    console.log(`Owner: ${wallet.address}`);

    const decimals = await token.decimals();
    
    console.log(`Token Decimals: ${decimals}`);
    const amount = ethers.parseUnits("100", decimals);

    for (let address of RECIPIENTS) {

        console.log(`Sending ${amount} tokens to ${address}...`);

        const tx = await token.transfer(address, amount);
        console.log(`  Tx sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`  ✅ Confirmed in block: ${receipt?.blockNumber}`);
    }
}

main().catch(console.error);
