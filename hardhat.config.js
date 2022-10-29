require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",

  networks: {
    goerli: {
      url: "https://eth-goerli.g.alchemy.com/v2/TWK_tJyx3RuXkT1qqlx6fDlXAsUt-2wy",
      accounts: [
        // "0xa3e9ad21b6ad5613ebd64694c29f82d15e17b79995cc1ae0158734967d49dda1",
        "3e40c49db394bc177202f08f24f62c8965c8af6da78bcdb05232abf6bf34d376",
      ],
    },
  },
  //Rinkeby is deprecated
  etherscan: {
    apiKey: "WZ1GNBB724W4NJW9ZYHNGDJYFMEBY2JVHZ",
    customChains: [
      {
        network: "songbird",
        chainId: 19,
        urls: {
          apiURL: "https://songbird-explorer.flare.network/api",
          browserURL: "https://songbird-explorer.flare.network",
        },
      },
    ],
  },
};
