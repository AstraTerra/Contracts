import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import "hardhat-deploy/dist/src/type-extensions";

const AggregatorInterfaceHMKT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hardhatArguments.network === "optimismKovan") {
		const { log } = deployments;

		const namedAccounts = await hre.getNamedAccounts();
		const HMKTAggregator = await deployments.getOrNull("AggregatorInterfaceHMKT");

		if (!HMKTAggregator) {
			const deployResult = await deployments.deploy("AggregatorInterfaceHMKT", {
				from: namedAccounts.deployer,
				skipIfAlreadyDeployed: true,
				log: true,
			});
			log(
				`AggregatorInterfaceHMKT deployed at ${deployResult.address} for ${deployResult.receipt?.gasUsed}`
			);
		}
	}
};

export default AggregatorInterfaceHMKT;
