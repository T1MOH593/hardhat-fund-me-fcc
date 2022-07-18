const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = getNamedAccounts
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Funding...")
    const txResponse = await fundMe.fund({
        value: ethers.utils.parseEther("0.1"),
    })
    await txResponse.wait(1)
    console.log("Funded!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        ProcessingInstruction.exit(1)
    })
