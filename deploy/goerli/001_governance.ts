import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";

module.exports = async ({ ethers, getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network === "goerli") {
		const ATG = await deployments.getOrNull("ATG");
		const { log } = deployments;
		const namedAccounts = await getNamedAccounts();
		const oneYear = 1675175407; // Mon, January 24 2023
		const threeDays = 259200;
		const [owner] = await ethers.getSigners();

		let nonce = await owner.getTransactionCount();
		const ATGAddress = ethers.utils.getContractAddress({
			from: namedAccounts.deployer,
			nonce: nonce++,
		});

		const timelockAddress = ethers.utils.getContractAddress({
			from: namedAccounts.deployer,
			nonce: nonce++,
		});

		const governorAddress = ethers.utils.getContractAddress({
			from: namedAccounts.deployer,
			nonce: nonce++,
		});
		try {
			const ATGDeployment = await deployments.get("ATG");
		} catch (error) {
			log(error.message);
			const ATGDeployment = await deployments.deploy("ATG", {
				from: namedAccounts.deployer,
				args: [namedAccounts.deployer, timelockAddress, oneYear],
			});
			log(`ATG deployed at ${ATGDeployment.address} for ${ATGDeployment.receipt?.gasUsed}`);
		}

		const timelockDeployment = await deployments.deploy("Timelock", {
			from: namedAccounts.deployer,
			args: [governorAddress, threeDays],
		});

		log(
			`Timelock deployed at ${timelockDeployment.address} for ${timelockDeployment.receipt?.gasUsed}`
		);

		const governorDeployment = await deployments.deploy("GovernorBeta", {
			from: namedAccounts.deployer,
			args: [timelockAddress, ATGAddress, namedAccounts.deployer],
		});

		log(
			`Governor Beta deployed at ${governorDeployment.address} for ${governorDeployment.receipt?.gasUsed}`
		);
	}
};
module.exports.tags = ["Governance"];
