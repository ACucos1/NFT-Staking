const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the address: ", deployer.address);
  console.log("Account balance: ", (await deployer.getBalance()).toString());

  const nft = await ethers.getContractFactory("Nft");
  const token = await ethers.getContractFactory("token");
  const Staking = await ethers.getContractFactory("Staking");

  //Deploy reward token and base nft collection first
  const deployedNft = await nft.deploy("testNft", "TESTNFT");
  const deployedToken = await token.deploy("testToken", "TESTTOKEN");
  await deployedNft.deployed();
  await deployedToken.deployed();

  console.log("Test NFT deployed at: ", deployedNft.address);
  console.log("Test token deployed at: ", deployedToken.address);

  const deployedStaking = await Staking.deploy(
    deployedNft.address,
    deployedToken.address
  );

  await deployedStaking.deployed();
  console.log("Staking contract deployed at:", deployedStaking.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
