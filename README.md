# NFT Staking Contract with ERC721 Proof of Stake NFT & ERC20 Reward Token

## Abstract

**WIP**  
This contract is an ERC721 compatible staking service through which users can stake their ERC721 NFTs and accumulte ERC20 Tokens over time as rewards.  
The contract takes as constructor arguments 2 addresses:

1. The address of the NFT you want users to stake
2. The address of the Token you want to distribute as rewards

**Before a user can stake their NFT, they must approve the staking contract as an operator so that it can transfer the NFTs to and from their wallet.**

When a user stakes their NFT, they are granted a new Proof of Stake NFT with the same ID as the token they staked which will show up in their wallet.  
From the time of staking, the user will start to accumulate a balance of reward tokens which they can claim at any time.

Stakers are free to stake as many NFTs as they wish, and will receive a proof of stake NFT for each NFT they stake.
Stakers can unstake at any time, ceasing the accumulation of rewards, but preserving any balances that have not been claimed yet.

## Deploying

Before deploying this Staking contract ensure that you have deployed both your NFT and your Reward token contracts and have the address handy.  
In `deploy.js`, change the constructor parameters for the Staking contract to the respective addresses and run `[yarn | npx] hardhat run scripts/deploy.js --network {network_name}`

## Rewards

In the current implementation, this contract is required to have a balance of the reward token in order to distribute it, as `safeTransfer` transfers from the `caller` to the `to account` as per the `SafeERC20` spec.

You can change `claimRewards()` to use `mint()` instead of `safeTransfer()`, but that requires that the reward token contract has a properly implemented `mint()` function.
