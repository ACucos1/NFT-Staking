// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Nft is ERC721 {
    uint256 counter;

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {
        counter = 0;
    }

    function mint() public {
        _safeMint(msg.sender, ++counter);
    }
}
