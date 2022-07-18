const { assert, expect } = require("chai")
const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let mockV3Aggregator
          let deployer
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async () => {
              // const accounts = await ethers.getSigners()
              // deployer = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", function () {
              it("Fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWithCustomError(
                      fundMe,
                      "FundMe__FewMoney"
                  )
              })

              it("Adds new funder", async () => {
                  await fundMe.fund({ value: sendValue })
                  assert.equal(deployer, await fundMe.getFunder(0))
              })

              it("Should update funder's value after donation", async () => {
                  await fundMe.fund({ value: sendValue })
                  const currValue = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(sendValue.toString(), currValue.toString())
              })
          })

          describe("withdraw", function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single founder", async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const ownerStartingBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  // Act
                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)

                  const { effectiveGasPrice, gasUsed } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingFundMeBalance.add(ownerStartingBalance).toString()
                  )
              })

              it("Withdraw ETH from multiple founders", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners
                  for (let i = 1; i < accounts.size; i++) {
                      const fundMeConnectedContract = fundMe.connect(
                          accounts[i]
                      )
                      fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const ownerStartingBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Act
                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)

                  const { effectiveGasPrice, gasUsed } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingFundMeBalance.add(ownerStartingBalance).toString()
                  )
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (let i = 1; i < accounts.size; i++) {
                      assert.equal(
                          fundMe.getAddressToAmountFunded(accounts[i].address),
                          0
                      )
                  }
              })

              it("Only owner can withdraw", async () => {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedFundMe = await fundMe.connect(attacker)
                  await expect(
                      attackerConnectedFundMe.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
          })
      })
