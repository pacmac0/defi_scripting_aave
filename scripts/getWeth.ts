// @ts-ignore
import { ethers, getNamedAccounts, network } from "hardhat"
import { networkConfig, AMOUNT } from "../helper-hardhat-config"

export async function getWeth() {
	const { deployer } = await getNamedAccounts()
	const iWeth = await ethers.getContractAt(
		"IWeth", // provide interface
		networkConfig[network.config!.chainId!].wethToken!, // WETH mainnet address (use forked chain)
		deployer
	)
	// "exchange" ETH for WETH
	const txResponse = await iWeth.deposit({
		value: AMOUNT,
	})
	await txResponse.wait(1)

	const wethBalance = await iWeth.balanceOf(deployer)
	console.log(`Got ${wethBalance.toString()} WETH`)
}
