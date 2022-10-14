import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";

const HMKT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "optimism") {
		const { log } = deployments;

		const namedAccounts = await hre.getNamedAccounts();
		const optimisticOrchestrator = await deployments.getOrNull("OptimisticOrchestrator");
		const HMKT = await deployments.getOrNull("HMKT");

		if (optimisticOrchestrator && !HMKT) {
			const name = "Total Crypto Market Cap";
			const symbol = "HMKT";
			const cap = 0;
			const orchestratorAddress = optimisticOrchestrator.address;

			const deployResult = await deployments.deploy("HMKT", {
				from: namedAccounts.deployer,
				skipIfAlreadyDeployed: true,
				log: true,
				args: [name, symbol, cap, orchestratorAddress],
			});
			log(`HMKT deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`);
		} else {
			log("HMKT already deployed or Orchestrator not found");
		}
	}
};

export default HMKT;
