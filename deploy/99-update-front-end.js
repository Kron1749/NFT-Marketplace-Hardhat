const { ethers, network } = require("hardhat")
const fs = require("fs")
const frontEndContractsFile =
    "../frontend-moralis-nft-marketplace-hardhat/constants/networkMapping.json"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end")
        await updateContractAddresses()
    }
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
