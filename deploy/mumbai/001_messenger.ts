import hre, { deployments, hardhatArguments } from "hardhat";

module.exports = async ({ getNamedAccounts, deployments }: any) => {
	// exit if network != mumbai
	if (hardhatArguments.network !== "mumbai")
		return;
	const fxchild = process.env.MUMBAI_FXCHILD_ADDRESS as string;
	const { deployIfDifferent, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const [owner] = await hre.ethers.getSigners();
	let nonce = await owner.getTransactionCount();
	const polygonOrchestratorAddress = hre.ethers.utils.getContractAddress({
			from: deployer,
			nonce: nonce + 2,
	});
	const polygonTreasuryAddress = hre.ethers.utils.getContractAddress({
			from: deployer,
			nonce: nonce + 3,
	});
	const deploymentMessengerDeployResult = await deployments.deploy("deploymentPolygonMessenger", {
		from: deployer,
		contract: "PolygonL2Messenger",
		skipIfAlreadyDeployed: true,
		log: true,
		args: [
			deployer, deployer
		]
	});
	log(
		`deploymentPolygonMessenger deployed at ${deploymentMessengerDeployResult.address} for ${deploymentMessengerDeployResult.receipt?.gasUsed}`
	);

	const messengerDeployResult = await deployments.deploy("PolygonL2Messenger", {
		from: deployer,
		skipIfAlreadyDeployed: true,
		log: true,
		args: [
			deployer, fxchild
		]
	});
	log(
		`PolygonL2Messenger deployed at ${messengerDeployResult.address} for ${messengerDeployResult.receipt?.gasUsed}`
	);

}

module.exports.tags = ["PolygonL2Messenger"]
