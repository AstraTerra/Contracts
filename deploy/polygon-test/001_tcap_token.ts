import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";

const HMKT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (hardhatArguments.network === "polygon") {
        const HMKT = await deployments.getOrNull("HMKT");
        const { log } = deployments;
        if (!HMKT) {
            const namedAccounts = await hre.getNamedAccounts();
            // Params
            const name = "Total Crypto Market Cap TEST";
            const symbol = "TESTpHMKT";
            const cap = 0;
            const orchestrator = await deployments.get("Orchestrator");

            const HMKTDeployment = await deployments.deploy("HMKT", {
                contract: "HMKT",
                from: namedAccounts.deployer,
                args: [name, symbol, cap, orchestrator.address],
                skipIfAlreadyDeployed: true,
                log: true,
            });
            log(
                `HMKT token deployed at ${HMKTDeployment.address} for ${HMKTDeployment.receipt?.gasUsed}`
            );
        } else {
            log("HMKT token already deployed");
        }
    }
};
export default HMKT;
