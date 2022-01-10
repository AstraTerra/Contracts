import { hardhatArguments } from "hardhat";
require("dotenv").config();
module.exports = async ({ getNamedAccounts, deployments }: any) => {
    if (hardhatArguments.network === "mumbai") {
        const { deployIfDifferent, log } = deployments;
        const { deployer } = await getNamedAccounts();

        log(
            `${hardhatArguments.network} found, deploying mockup DAI contracts`
        );

        //Deploy Mock DAIs
        let DAI, WMATIC;
        try {
            DAI = await deployments.get("DAI");
        } catch (error) {
            log(error.message);

            const deployResult = await deployIfDifferent(
                ["data"],
                "DAI",
                { from: deployer },
                "DAI"
            );
            DAI = await deployments.get("DAI");
            if (deployResult.newlyDeployed) {
                log(
                    `DAI deployed at ${DAI.address} for ${deployResult.receipt.gasUsed}`
                );
            }

            try {
                WMATIC = await deployments.get("WMATIC");
            } catch (error) {
                log(error.message);

                const deployResult = await deployIfDifferent(
                    ["data"],
                    "WMATIC",
                    { from: deployer },
                    "WMATIC"
                );
                WMATIC = await deployments.get("WMATIC");
                if (deployResult.newlyDeployed) {
                    log(
                        `WMATIC deployed at ${WMATIC.address} for ${deployResult.receipt.gasUsed}`
                    );
                }
            }
        }
    }
};
module.exports.tags = ["DAI", "WMATIC"];
