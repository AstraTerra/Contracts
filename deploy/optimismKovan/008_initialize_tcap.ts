import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
	if (hardhatArguments.network === "optimismKovan") {
		let DAIHandler = await deployments.get("DAIVaultHandler");
		let WETHHandler = await deployments.get("WETHVaultHandler");
		let OrchestratorDeployment = await deployments.get("OptimisticOrchestrator");
		let HMKT = await deployments.get("HMKT");

		let orchestrator = await ethershardhat.getContractAt(
			"OptimisticOrchestrator",
			OrchestratorDeployment.address
		);

		let HMKTContract = await ethershardhat.getContractAt("HMKT", HMKT.address);
		console.log("DAI Vault", await HMKTContract.vaultHandlers(DAIHandler.address));
		console.log("WETHHandler Vault", await HMKTContract.vaultHandlers(WETHHandler.address));

		console.log(await orchestrator.owner());
		console.log(await orchestrator.ovmL2CrossDomainMessenger());

		console.log("Adding vault Handlers");

		// await orchestrator.addHMKTVault(HMKT.address, DAIHandler.address);
		// await orchestrator.addHMKTVault(HMKT.address, WETHHandler.address);
	}
};
module.exports.tags = ["Initialize"];
