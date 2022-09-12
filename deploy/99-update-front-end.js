const { ethers, network } = require("hardhat")
const fs = require("fs")
const frontEndContractsFile =
    "../nextjs-nft-marketplace-moralis-fcc-main/constants/networkMapping.json"
const frontEndAbiLocation = "../nextjs-nft-marketplace-moralis-fcc-main/constants/"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end")
        await updateContractAddresses()
        await updateAbi()
    }
}

async function updateAbi() {
    const nftMarketplace = await ethers.getContract("NFTMarketplace")
    fs.writeFileSync(
        `${frontEndAbiLocation}NFTMarketplace.json`,
        nftMarketplace.interface.format(ethers.utils.FormatTypes.json)
    )

    const basicNft = await ethers.getContract("BasicNft")
    fs.writeFileSync(
        `${frontEndAbiLocation}BasicNft.json`,
        basicNft.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAddresses() {
    const NFTMarketplace = await ethers.getContract("NFTMarketplace")
    const chainId = network.config.chainId.toString()
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    if (chainId in contractAddresses) {
        if (
            !contractAddresses[chainId]["NFTMarketplace"].includes(NFTMarketplace.address)
        ) {
            contractAddresses[chainId]["NFTMarketplace"].push(NFTMarketplace.address)
        }
    } else {
        contractAddresses[chainId] = { NFTMarketplace: [NFTMarketplace.address] }
    }

    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

module.exports.tags = ["all", "frontend"]
