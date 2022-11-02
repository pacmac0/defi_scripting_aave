import { getWeth } from "./getWeth"
import { getNamedAccounts, network, ethers } from "hardhat"
import { networkConfig, AMOUNT } from "../helper-hardhat-config"
import { ILendingPool, ILendingPoolAddressesProvider } from "../typechain-types"
import { Address } from "hardhat-deploy/dist/types"
import { BigNumber } from "ethers"

async function main() {
	await getWeth()
	const { deployer } = await getNamedAccounts()
	const lendingPool: ILendingPool = await getLendingPool(deployer)
	const wethTokenAddress = networkConfig[network.config!.chainId!].wethToken!
	await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
	console.log(
		`Depositing WETH using ${wethTokenAddress} as WETH token and ${deployer} as address`
	)
	await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0) // check docs
	console.log("Desposited!")
	// Getting your borrowing stats
	let borrowReturnData = await getBorrowUserData(lendingPool, deployer)
	let availableBorrowsETH = borrowReturnData[0]
	const daiPrice = await getDaiPrice()
	const amountDaiToBorrow = availableBorrowsETH.div(daiPrice)
	const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
	console.log(`You can borrow ${amountDaiToBorrow.toString()} DAI`)
	await borrowDai(
		lendingPool,
		networkConfig[network.config!.chainId!].daiToken!,
		amountDaiToBorrowWei.toString(),
		deployer
	)
	await getBorrowUserData(lendingPool, deployer)
	await repay(
		lendingPool,
		networkConfig[network.config!.chainId!].daiToken!,
		amountDaiToBorrowWei.toString(),
		deployer
	)
	await getBorrowUserData(lendingPool, deployer)
}

// helper functions
async function getLendingPool(account: Address): Promise<ILendingPool> {
	// get address provider
	// remember needed are, ABI, contract address and signer
	const lendingpoolAddressesProvider: ILendingPoolAddressesProvider = await ethers.getContractAt(
		"ILendingPoolAddressesProvider",
		networkConfig[network.config.chainId!].lendingPoolAddressesProvider,
		account
	)
	// call provider for pool address
	const lendingPoolAddress = await lendingpoolAddressesProvider.getLendingPool()
	// get pool-contract
	const lendingPoolContract: ILendingPool = await ethers.getContractAt(
		"ILendingPool",
		lendingPoolAddress,
		account
	)
	return lendingPoolContract
}

async function approveErc20(
	erc20Address: Address,
	spennderAddress: Address,
	amount: string,
	signer: Address
) {
	// get token contract
	const erc20Contract = await ethers.getContractAt("IERC20", erc20Address, signer)
	// call approve function on contract and wait for response
	const txResponse = await erc20Contract.approve(spennderAddress, amount)
	txResponse.wait(1)
	console.log(`Token approved!`)
}

async function getBorrowUserData(
	lendingPool: ILendingPool,
	user: Address
): Promise<[BigNumber, BigNumber]> {
	// get data from contract and return it
	const {
		totalCollateralETH,
		totalDebtETH,
		availableBorrowsETH,
		currentLiquidationThreshold,
		ltv,
		healthFactor,
	} = await lendingPool.getUserAccountData(user)
	console.log(`Your deposits are worth ${totalCollateralETH} ETH.`)
	console.log(`Your debt is ${totalDebtETH} in ETH.`)
	console.log(`You can borrow ${availableBorrowsETH} worth of ETH.`)
	return [availableBorrowsETH, totalDebtETH]
}

async function getDaiPrice() {
	const daiEthPriceFeed = await ethers.getContractAt(
		"AggregatorV3Interface",
		networkConfig[network.config!.chainId!].daiEthPriceFeed!
	)
	const price = (await daiEthPriceFeed.latestRoundData())[1]
	console.log(`The DAI/ETH price is ${price.toString()}`)
	return price
}

async function borrowDai(
	lendingPool: ILendingPool,
	daiAddress: Address,
	amount: string,
	account: Address
) {
	// call borrow on aave contract
	const borrowTx = await lendingPool.borrow(daiAddress, amount, 1, 0, account) // hardcoded are some configs e.g. static vs. variable borrow
	await borrowTx.wait(1)
	console.log("You've borrowed!")
}

async function repay(
	lendingPool: ILendingPool,
	daiAddress: Address,
	amount: string,
	account: Address
) {
	// approve dai spending for lendingpool
	await approveErc20(daiAddress, lendingPool.address, amount, account)
	// call lendingPoolContract
	const repayTx = await lendingPool.repay(daiAddress, amount, 1, account)
	await repayTx.wait(1)
	console.log(`Repaied!`)
}

// main call for async follow uo
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
