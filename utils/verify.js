const { run } = require("hardhat")

async function verify(contractAddress, args) {
    console.log("Verifying deployed contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
        console.log("Verified!!!")
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!")
        } else {
            console.log(e)
        }
    }
}

module.exports = {
    verify,
}
