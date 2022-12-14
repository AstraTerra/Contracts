import hre, { deployments, hardhatArguments } from "hardhat";

module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network !== "mumbai")
			return;
	const { deployIfDifferent, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const deploymentPolygonMessengerDeployResult = await deployments.get("deploymentPolygonMessenger");

	const orchestratorDeployResult = await deployments.deploy("PolygonOrchestrator", {
		from: deployer,
		skipIfAlreadyDeployed: true,
		log: true,
		// 	Note: Owner is set to deployer so that initial vaults can be
		// launched without the need for voting
		// The owner should be changed to timelock post setup
		args: [deployer, deployer, deploymentPolygonMessengerDeployResult.address]
	});

	log(
		`PolygonOrchestrator deployed at ${orchestratorDeployResult.address} for ${orchestratorDeployResult.receipt?.gasUsed}`
	);

}
