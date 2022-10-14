import { hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
    if (hardhatArguments.network === "kovan") {
        const { deployIfDifferent, log } = deployments;
        const { deployer } = await getNamedAccounts();
        const name = process.env.NAME;
        const symbol = process.env.SYMBOL;

        let orchestrator = await deployments.get("Orchestrator");

        let HMKT;
        try {
            HMKT = await deployments.get("HMKT");
        } catch (error) {
            log(error.message);

            const deployResult = await deployIfDifferent(
                ["data"],
                "HMKT",
                { from: deployer },
                "HMKT",
                name,
                symbol,
                0,
                orchestrator.address
            );
            HMKT = await deployments.get("HMKT");
            if (deployResult.newlyDeployed) {
                log(
                    `HMKT deployed at ${HMKT.address} for ${deployResult.receipt.gasUsed}`
                );
            }
        }
    }
};
module.exports.tags = ["HMKT"];
