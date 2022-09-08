const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Marketplace Tests", function () {
          let nftMarketplace, basicNft, deployer, player
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0
          beforeEach(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
              await deployments.fixture(["all"])
              nftMarketplace = await ethers.getContract("NFTMarketplace")
              basicNft = await ethers.getContract("BasicNft")
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          })

          it("Lists and can be bought", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              const playerConnectedToNftMarketplace = nftMarketplace.connect(player)
              await playerConnectedToNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                  value: PRICE,
              })
              const newOwner = await basicNft.ownerOf(TOKEN_ID)
              const deployerProceeds = await nftMarketplace.getProceeds(deployer.address)
              assert(newOwner.toString() == player.address)
              assert(deployerProceeds.toString() == PRICE.toString())
          })

          it("Can't be listed if already listed", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              await expect(
                  nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              ).to.be.revertedWith("NFTMarketplace__AlreadyListed")
          })

          it("Can't be listed if price below 0", async function () {
              await expect(
                  nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)
              ).to.be.revertedWith("NFTMarketplace__PriceMustBeAboveZero")
          })
          it("Can't cancel listing if not the owner", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              const playerConnectedToNftMarketplace = nftMarketplace.connect(player)
              await expect(
                  playerConnectedToNftMarketplace.updateListing(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE + 1
                  )
              ).to.be.revertedWith("NFTMarketplace__NotOwner")
          })
          it("Can't list item if not approved", async function () {
              basicNft2 = await ethers.getContract("BasicNft")
              await basicNft2.mintNft()
              await basicNft2.approve(
                  "0xf37955134dda37eac7380f5eb42bce10796bd224",
                  TOKEN_ID
              )
              await expect(
                  nftMarketplace.listItem(basicNft2.address, TOKEN_ID, PRICE)
              ).to.be.revertedWith("NFTMarketplace__NotApprovedForMarketplace")
          })
          it("Can't buy item if it is not listed", async function () {
              await expect(
                  nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
              ).to.be.revertedWith("NFTMarketplace__NotListed")
          })
          it("Can't buy item if buyer don't have enough value", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              const playerConnectedToNftMarketplace = nftMarketplace.connect(player)
              await expect(
                  playerConnectedToNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                      value: 0,
                  })
              ).to.be.revertedWith("NFTMarketplace__PriceNotMet")
          })
          it("Can list and delete NFT from markteplace", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              expect(
                  await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
              ).to.emit("ItemCanceled")
          })
          it("Can list and update listing", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              expect(
                  await nftMarketplace.updateListing(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE + 1
                  )
              ).to.emit("ItemListed")
              const newPrice = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
              const prevPrice = (PRICE + 1).toString()
              assert.equal(newPrice.price.toString(), prevPrice)
          })
          it("Successfully withdraw", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              const playerConnectedToNftMarketplace = nftMarketplace.connect(player)
              await playerConnectedToNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                  value: PRICE,
              })
              await nftMarketplace.withdrawProceeds()
              const proceeds = await nftMarketplace.getProceeds(deployer.address)
              const balanceAfterWithdraw = await deployer.getBalance()
              assert.equal(proceeds, 0)
          })

          it("Can't withdraw if no proceeds", async function () {
              await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
                  "NFTMarketplace__NoProceeds"
              )
          })
      })
