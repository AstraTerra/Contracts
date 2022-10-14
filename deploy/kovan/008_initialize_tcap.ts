import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
    if (hardhatArguments.network === "kovan") {
        let DAIHandler = await deployments.get("DAIVaultHandler");
        let WETHHandler = await deployments.get("WETHVaultHandler");
        let OrchestratorDeployment = await deployments.get("Orchestrator");
        let HMKT = await deployments.get("HMKT");

        let orchestrator = await ethershardhat.getContractAt(
            "Orchestrator",
            OrchestratorDeployment.address
        );

        console.log("Adding vault Handlers");
        await orchestrator.addHMKTVault(HMKT.address, DAIHandler.address);
        await orchestrator.addHMKTVault(HMKT.address, WETHHandler.address);
    }
};
module.exports.tags = ["Initialize"];
