const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });

const contract = require("../artifacts/contracts/nft.sol/Nft.json");

const web3Provider = new ethers.providers.AlchemyProvider(
  "goerli",
  "TWK_tJyx3RuXkT1qqlx6fDlXAsUt-2wy"
);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, web3Provider);

const nftContract = new ethers.Contract(
  "0x16e2197927B00D2082e3537b2420D91A441FE5aa",
  contract.abi,
  signer
);

async function main() {
  const mint = await nftContract.mint();
  await mint.wait();

  console.log(wait);
}

main()
  .then(() => process.exit(1))
  .catch((err) => console.log(err));
