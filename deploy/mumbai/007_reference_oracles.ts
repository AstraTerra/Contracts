import { deployments, hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
    if (hardhatArguments.network === "mumbai") {
        const { deployIfDifferent, log } = deployments;
        const { deployer } = await getNamedAccounts();

        let HMKTOracle, WMATICOracle, DAIOracle;

        const timelock = process.env.GOERLI_TIMELOCK_ADDRESS as string;
        const HMKTAggregator = await deployments.getOrNull(
            "AggregatorInterfaceHMKT"
        );

        try {
            HMKTOracle = await deployments.get("HMKTOracle");
        } catch (error) {
            log(error.message);
            let oracleAddress = HMKTAggregator.address;
            const deployResult = await deployIfDifferent(
                ["data"],
                "HMKTOracle",
                { from: deployer },
                "ChainlinkOracle",
                oracleAddress,
                // 	TODO: deployer should timelock address
                deployer
            );
            HMKTOracle = await deployments.get("HMKTOracle");
            if (deployResult.newlyDeployed) {
                log(
                    `Oracle deployed at ${HMKTOracle.address} for ${deployResult.receipt.gasUsed}`
                );
            }
            try {
                WMATICOracle = await deployments.get("WMATICOracle");
            } catch (error) {
                log(error.message);
                let oracleAddress =
                    "0x0715A7794a1dc8e42615F059dD6e406A6594651A";
                const deployResult = await deployIfDifferent(
                    ["data"],
                    "WMATICOracle",
                    { from: deployer },
                    "ChainlinkOracle",
                    oracleAddress,
                    // 	TODO: deployer should timelock address
                    deployer
                );
                WMATICOracle = await deployments.get("WMATICOracle");
                if (deployResult.newlyDeployed) {
                    log(
                        `Price Feed Oracle deployed at ${WMATICOracle.address} for ${deployResult.receipt.gasUsed}`
                    );
                }
                try {
                    DAIOracle = await deployments.get("DAIOracle");
                } catch (error) {
                    log(error.message);
                    let oracleAddress =
                        "0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046";
                    const deployResult = await deployIfDifferent(
                        ["data"],
                        "DAIOracle",
                        { from: deployer },
                        "ChainlinkOracle",
                        oracleAddress,
                        // 	TODO: deployer should timelock address
                    		deployer
                    );
                    DAIOracle = await deployments.get("DAIOracle");
                    if (deployResult.newlyDeployed) {
                        log(
                            `Price Feed Oracle deployed at ${DAIOracle.address} for ${deployResult.receipt.gasUsed}`
                        );
                    }
                }
            }
        }
    }
};
module.exports.tags = ["Oracle", "ChainlinkOracle"];
