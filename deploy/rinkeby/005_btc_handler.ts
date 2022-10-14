import { hardhatArguments } from "hardhat";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const BTCVaultHandler = async (hre: HardhatRuntimeEnvironment) => {
	if (hardhatArguments.network === "rinkeby") {
		const { log } = deployments;
		const namedAccounts = await hre.getNamedAccounts();
		const deployer = namedAccounts.deployer;
		const ethers = hre.ethers;

		let handlerContract;
		let orchestrator = await deployments.get("Orchestrator");

		try {
			handlerContract = await deployments.get("BTCVaultHandler");
		} catch (error) {
			let HMKT = await deployments.get("HMKT");
			let BTCContract = await deployments.get("WBTC");
			let divisor = "10000000000";
			let ratio = "150";
			let burnFee = "1";
			let liquidationPenalty = "10";
			let HMKTOracle = await deployments.get("HMKTOracle");
			let priceFeedETH = await deployments.get("WETHOracle");
			let priceFeedBTC = await deployments.get("BTCOracle");
			const timelock = await deployments.get("Timelock");
			const deployResult = await deployments.deploy("BTCVaultHandler", {
				from: deployer,
				contract: "ERC20VaultHandler",
				args: [
					orchestrator.address,
					divisor,
					ratio,
					burnFee,
					liquidationPenalty,
					HMKTOracle.address,
					HMKT.address,
					BTCContract.address,
					priceFeedBTC.address,
					priceFeedETH.address,
					ethers.constants.AddressZero,
					timelock.address,
				],
				skipIfAlreadyDeployed: true,
			});
			handlerContract = await deployments.get("BTCVaultHandler");
			if (deployResult.newlyDeployed) {
				log(
					`BTCVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt?.gasUsed}`
				);
			}
		}
	}
};

export default BTCVaultHandler;
