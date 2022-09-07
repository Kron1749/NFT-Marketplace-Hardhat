// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NFTMarketplace_PriceMustBeAboveZero();
error NFTMarketplace_NotApprovedForMarketplace();

contract NFTMarketplace {

    struct Listing {
        uint256 price;
        address seller;
    }

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    //NFT contract => NFT TokenId -> Listing
    mapping(address => mapping(uint256=>Listing)) private s_listings;

    function listItem(address nftAddress,uint256 tokenId,uint256 price) external {
        if(price<=0) { revert NFTMarketplace_PriceMustBeAboveZero();}
        IERC721 nft = IERC721(nftAddress);
        if(nft.getApproved(tokenId)!=address(this)) {
            revert NFTMarketplace_NotApprovedForMarketplace();   
        }
        s_listings[nftAddress][tokenId] = Listing(price,msg.sender);
        emit ItemListed(msg.sender,nftAddress,tokenId,price);

    }
}