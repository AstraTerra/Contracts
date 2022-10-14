import hre, { ethers as ethershardhat, hardhatArguments } from "hardhat";
import { Contract, utils } from "ethers";
require("dotenv").config();

let abiCoder = new utils.AbiCoder();

async function makePolygonMessageCall(
		_polygonMessenger: Contract,
		_target_address: string,
		deployer_address: string,
		function_name: string,
		args_type: string[],
		args: any[],
) {
	let ABI = [ `function ${function_name}(${args_type.toString()})` ];
	let iface = new hre.ethers.utils.Interface(ABI);
	let _data = iface.encodeFunctionData(function_name, args);
	let _callData = abiCoder.encode(['address', 'bytes'], [_target_address, _data]);
	return await _polygonMessenger.functions.processMessageFromRoot(1, deployer_address, _callData);
}

module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network !== "mumbai") {
		return;
	}
	let DAIHandler = await deployments.get("DAIVaultHandler");
	let WMATICHandler = await deployments.get("MATICVaultHandler");
	let OrchestratorDeployment = await deployments.get("PolygonOrchestrator");
	let HMKT = await deployments.get("HMKT");
	const { deployer } = await getNamedAccounts();

	const deploymentPolygonMessengerDeployment = await deployments.get("deploymentPolygonMessenger");
	const deploymentPolygonMessenger = await ethershardhat.getContractAt(
		"PolygonL2Messenger",
		deploymentPolygonMessengerDeployment.address
	);
	const polygonMessengerDeployment = await deployments.get("PolygonL2Messenger");

	let tx = await makePolygonMessageCall(
		deploymentPolygonMessenger,
		OrchestratorDeployment.address,
		deployer,
		"addHMKTVault",
		["address", "address"],
		[HMKT.address, WMATICHandler.address]
	);
	await tx.wait();

	tx = await makePolygonMessageCall(
		deploymentPolygonMessenger,
		OrchestratorDeployment.address,
		deployer,
		"addHMKTVault",
		["address", "address"],
		[HMKT.address, DAIHandler.address]
	);
	await tx.wait();

	let HMKTContract = await ethershardhat.getContractAt("HMKT", HMKT.address);
	console.log("DAI Vault", await HMKTContract.vaultHandlers(DAIHandler.address));
	console.log("WETHHandler Vault", await HMKTContract.vaultHandlers(WMATICHandler.address));
	tx = await makePolygonMessageCall(
		deploymentPolygonMessenger,
		OrchestratorDeployment.address,
		deployer,
		"updatePolygonMessenger",
		["address"],
		[polygonMessengerDeployment.address]
	);
	await tx.wait();

};
module.exports.tags = ["Initialize"];
module.exports.dependencies = ['DAIVaultHandler', 'WMATICVaultHandler'];
