const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const nftAbi = require("../artifacts/contracts/nft.sol/Nft.json");
const rewardTokenAbi = require("../artifacts/contracts/token.sol/token.json");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking Contract Tests", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractsFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const nft = await ethers.getContractFactory("Nft");
    const nftContract = await nft.deploy("testNft", "TESTNFT");

    const token = await ethers.getContractFactory("token");
    const tokenContract = await token.deploy("testToken", "TESTTOKEN");

    const staking = await ethers.getContractFactory("Staking");
    const stakingContract = await staking.deploy(
      nftContract.address,
      tokenContract.address
    );

    return {
      stakingContract,
      nftContract,
      tokenContract,
      owner,
      otherAccount,
    };
  }

  describe("Deployment", function () {
    it("NFT Address & Token Address should be correct", async function () {
      const { stakingContract, nftContract, tokenContract } = await loadFixture(
        deployContractsFixture
      );

      expect(await stakingContract.nftCollection()).to.equal(
        nftContract.address
      );
      expect(await stakingContract.xpToken()).to.equal(tokenContract.address);
    });

    it("Staking contract has the correct owner", async () => {
      const { stakingContract, owner } = await loadFixture(
        deployContractsFixture
      );
      expect(await stakingContract.owner()).to.equal(owner.address);
    });
  });

  describe("Staking", () => {
    it("Staking fails if user hasn't approved the staking contract as an operator", async () => {
      const { stakingContract, nftContract } = await loadFixture(
        deployContractsFixture
      );

      // Mint an NFT to try and stake
      await nftContract.mint();

      // Try to stake it
      await expect(stakingContract.stake([1])).to.be.revertedWith(
        "ERC721: caller is not token owner nor approved"
      );
    });

    it("Staking fails if user does not own the token", async () => {
      const { stakingContract, nftContract, otherAccount } = await loadFixture(
        deployContractsFixture
      );

      await nftContract.connect(otherAccount).mint();

      await expect(stakingContract.stake([1])).to.be.revertedWith(
        "Cant stake tokens you dont own"
      );
    });

    it("Staking fails if the token is already staked", async () => {
      const { stakingContract, nftContract } = await loadFixture(
        deployContractsFixture
      );
      await nftContract.mint();
      await nftContract.approve(stakingContract.address, 1);
      await stakingContract.stake([1]);

      await expect(stakingContract.stake([1])).to.be.revertedWith(
        "Cant stake tokens you dont own"
      );
    });

    it("Staking succeeds and mints proof of stake nft and tranfsers user nft to staking contract", async () => {
      const { stakingContract, nftContract, owner } = await loadFixture(
        deployContractsFixture
      );
      await nftContract.mint();
      await nftContract.approve(stakingContract.address, 1);

      expect(await stakingContract.stake([1]))
        .to.changeTokenBalance(stakingContract, owner, 1)
        .and.to.changeTokenBalance(nftContract, owner, -1);
    });
  });

  describe("Unstaking", () => {
    it("Unstaking should fail if use has no staked tokens", async () => {
      const { stakingContract } = await loadFixture(deployContractsFixture);

      await expect(stakingContract.unstake([1])).to.be.revertedWith(
        "You have no staked tokens"
      );
    });

    it("Unstaking should fail if the token is not staked", async () => {
      const { stakingContract, nftContract } = await loadFixture(
        deployContractsFixture
      );
      await nftContract.mint();
      await nftContract.mint();
      await nftContract.approve(stakingContract.address, 1);
      await stakingContract.stake([1]);

      await expect(stakingContract.unstake([2])).to.be.revertedWith(
        "You havent staked this token"
      );
    });

    it("Successful unstake should return nft back to user and return proof of stake nft to contract", async () => {
      const { stakingContract, nftContract, owner } = await loadFixture(
        deployContractsFixture
      );
      await nftContract.mint();
      await nftContract.mint();
      await nftContract.approve(stakingContract.address, 1);
      await stakingContract.stake([1]);

      expect(await stakingContract.unstake([1]))
        .to.changeTokenBalance(stakingContract, owner, -1)
        .and.to.changeTokenBalance(nftContract, owner, 1);
    });
  });
});
