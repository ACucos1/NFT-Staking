// SPDX-License-Identifier: Unlicensed
// Creator: Alex Cucos - based on https://github.com/andreitoma8/ERC721-Staking/blob/master/contracts/ERC721Staking.sol

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Staking is
    IERC721,
    IERC721Metadata,
    IERC721Receiver,
    Ownable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;
    using Strings for uint256;

    IERC721 public immutable nftCollection;

    IERC20 public immutable xpToken;

    struct Balance {
        uint256 amountStaked;
        uint256 timeOfLastUpdate;
        uint256 unclaimedXp;
    }

    //IERC721Metadata name() & symbol() overrides
    string public constant override name = "Staking Contract";
    string public constant override symbol = "STK";

    uint256 private xpPerHour = 100000;

    mapping(address => Balance) public stakerBalances;
    mapping(uint256 => address) public stakerAddress;

    string public baseUri;

    address[] public stakersArray;
    bool public isStakingOpened;

    constructor(IERC721 _nftCollection, IERC20 _xpToken) {
        nftCollection = _nftCollection;

        xpToken = _xpToken;
    }

    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external override nonReentrant returns (bytes4) {
        require(
            msg.sender == address(nftCollection),
            "Can only stake [collection]"
        );
        require(isStakingOpened, "staking closed");
        stakerAddress[tokenId] = msg.sender;
        stakerBalances[msg.sender].timeOfLastUpdate = block.timestamp;
        stakerBalances[msg.sender].amountStaked += 1;

        emit Transfer(address(0), from, tokenId);
        return this.onERC721Received.selector;
    }

    //On Stake - send staker nft to msg.sender
    function stake(uint256[] calldata _tokenIds) external nonReentrant {
        if (stakerBalances[msg.sender].amountStaked > 0) {
            uint256 rewards = calculateXp(msg.sender);
            stakerBalances[msg.sender].unclaimedXp += rewards;
        } else {
            stakersArray.push(msg.sender);
        }
        uint256 len = _tokenIds.length;
        for (uint256 i; i < len; ++i) {
            require(
                nftCollection.ownerOf(_tokenIds[i]) == msg.sender,
                "Can't stake tokens you don't own"
            );
            nftCollection.transferFrom(msg.sender, address(this), _tokenIds[i]);
            emit Transfer(address(0), msg.sender, _tokenIds[i]);
            stakerAddress[_tokenIds[i]] = msg.sender;
        }
        stakerBalances[msg.sender].timeOfLastUpdate = block.timestamp;
        stakerBalances[msg.sender].amountStaked += len;

        //Mint one staker NFT per nft staked? or just one per address and keep track of balance
    }

    function unstake(uint256[] calldata _tokenIds) external nonReentrant {
        require(
            stakerBalances[msg.sender].amountStaked > 0,
            "You have no staked tokens"
        );
        uint256 rewards = calculateXp(msg.sender);
        stakerBalances[msg.sender].unclaimedXp += rewards;
        uint256 len = _tokenIds.length;
        for (uint256 i; i < len; ++i) {
            require(stakerAddress[_tokenIds[i]] == msg.sender);
            stakerAddress[_tokenIds[i]] = address(0);
            nftCollection.transferFrom(address(this), msg.sender, _tokenIds[i]);
            emit Transfer(msg.sender, address(0), _tokenIds[i]);
        }
        stakerBalances[msg.sender].amountStaked -= len;
        stakerBalances[msg.sender].timeOfLastUpdate = block.timestamp;
        if (stakerBalances[msg.sender].amountStaked == 0) {
            for (uint256 i; i < stakersArray.length; ++i) {
                if (stakersArray[i] == msg.sender) {
                    stakersArray[i] = stakersArray[stakersArray.length - 1];
                    stakersArray.pop();
                }
            }
        }
    }

    function claimRewards() external {
        uint256 rewards = calculateXp(msg.sender) +
            stakerBalances[msg.sender].unclaimedXp;

        require(rewards > 0, "You have no rewards to claim");
        stakerBalances[msg.sender].timeOfLastUpdate = block.timestamp;
        stakerBalances[msg.sender].unclaimedXp = 0;
        xpToken.safeTransfer(msg.sender, rewards);
    }

    function setXpPerHour(uint256 _newValue) public onlyOwner {
        address[] memory _stakers = stakersArray;
        uint256 len = _stakers.length;
        for (uint256 i; i < len; ++i) {
            address user = _stakers[i];
            stakerBalances[user].unclaimedXp += calculateXp(msg.sender);
            stakerBalances[msg.sender].timeOfLastUpdate = block.timestamp;
        }
        xpPerHour = _newValue;
    }

    //////////////
    //   View   //
    //////////////

    function userStakeInfo(address _user)
        public
        view
        returns (uint256 _tokensStaked, uint256 _availableRewards)
    {
        return (stakerBalances[_user].amountStaked, availableRewards(_user));
    }

    function availableRewards(address _user) internal view returns (uint256) {
        if (stakerBalances[_user].amountStaked == 0) {
            return stakerBalances[_user].unclaimedXp;
        }
        uint256 _rewards = stakerBalances[_user].unclaimedXp +
            calculateXp(_user);
        return _rewards;
    }

    //////////////
    // Internal //
    //////////////

    /**
        Calculate rewards for @param _staker by calculating the time passed
        since the last update in hours & multiplying it by ERC721 Tokens Staked & xpPerHour    
        @return _rewards - The amount of erc20 token earened
    */
    function calculateXp(address _staker)
        internal
        view
        returns (uint256 _rewards)
    {
        Balance memory staker = stakerBalances[_staker];
        return (((
            ((block.timestamp - staker.timeOfLastUpdate) * staker.amountStaked)
        ) * xpPerHour) / 3600);
    }

    ///////////////
    // Overrides //
    ///////////////
    // IERC-721

    function ownerOf(uint256 tokenId) external view override returns (address) {
        address owner = stakerAddress[tokenId];
        require(owner != address(0), "Invalid Token ID");
        return owner;
    }

    function balanceOf(address owner) external view override returns (uint256) {
        require(owner != address(0), "Zero address is invalid");
        return stakerBalances[owner].amountStaked;
    }

    function approve(address, uint256) external pure override {
        _revertTransfer();
    }

    function getApproved(uint256) external pure override returns (address) {
        _revertTransfer();
    }

    function setApprovalForAll(address, bool) external pure override {
        _revertTransfer();
    }

    function isApprovedForAll(address, address)
        external
        pure
        override
        returns (bool)
    {
        return false;
    }

    function transferFrom(
        address,
        address,
        uint256
    ) external pure override {
        _revertTransfer();
    }

    function safeTransferFrom(
        address,
        address,
        uint256
    ) external pure override {
        _revertTransfer();
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override {
        _revertTransfer();
    }

    function _revertTransfer() private pure {
        revert("cannot transfer a non-transferable token");
    }

    ///////////////
    // Overrides //
    ///////////////
    // IERC-721-Metadata
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(stakerAddress[tokenId] != address(0), "Invalid Token Id");
        return
            bytes(baseUri).length > 0
                ? string(abi.encodePacked(baseUri, tokenId.toString()))
                : "";
    }

    ///////////////
    // Overrides //
    ///////////////
    // IERC-165

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC721).interfaceId;
    }
}
