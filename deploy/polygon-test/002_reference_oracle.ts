import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";

const HMKTOracle: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "polygon") {
        const HMKTOracle = await deployments.getOrNull("HMKTOracle");
        const maticOracle = await deployments.getOrNull("MATICOracle");
        const { log } = deployments;

        if (!HMKTOracle) {
            const namedAccounts = await hre.getNamedAccounts();
            // Params TODO: complete address
            const aggregator = "0xBb9749B5AD68574C106AC4F9cd5E1c400dbb88C3"; // HMKT Chainlink Oracle

            const HMKTOracleDeployment = await deployments.deploy(
                "HMKTOracle",
                {
                    contract: "ChainlinkOracle",
                    from: namedAccounts.deployer,
                    args: [aggregator],
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `HMKT Oracle deployed at ${HMKTOracleDeployment.address} for ${HMKTOracleDeployment.receipt?.gasUsed}`
            );
        } else {
            log("HMKT Oracle already deployed");
        }

        if (!maticOracle) {
            const namedAccounts = await hre.getNamedAccounts();
            // Params
            const aggregator = "0xab594600376ec9fd91f8e885dadf0ce036862de0"; // MATIC Chainlink Oracle
            const maticOracleDeployment = await deployments.deploy(
                "MATICOracle",
                {
                    contract: "ChainlinkOracle",
                    from: namedAccounts.deployer,
                    args: [aggregator],
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `HMKT Oracle deployed at ${maticOracleDeployment.address} for ${maticOracleDeployment.receipt?.gasUsed}`
            );
        } else {
            log("HMKT Oracle already deployed");
        }
    }
};
export default HMKTOracle;
