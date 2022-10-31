const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Staking", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployStakingContractFixture() {
    // const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    // const ONE_GWEI = 1_000_000_000;

    // const lockedAmount = ONE_GWEI;
    // const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const testNftAddress = "0x16e2197927B00D2082e3537b2420D91A441FE5aa";
    const testTokenAddress = "0xEC87de77c63B7ce98c4902299669041F999c524f";

    const staking = await ethers.getContractFactory("Staking");
    const stakingContract = await staking.deploy(
      testNftAddress,
      testTokenAddress
    );

    return {
      stakingContract,
      owner,
      otherAccount,
      testNftAddress,
      testTokenAddress,
    };
  }

  describe("Deployment", function () {
    it("NFT Address & Token Address should be correct", async function () {
      const { stakingContract, testNftAddress, testTokenAddress } =
        await loadFixture(deployStakingContractFixture);

      expect(await stakingContract.nftCollection()).to.equal(testNftAddress);
      expect(await stakingContract.xpToken()).to.equal(testTokenAddress);
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });
  });
});
