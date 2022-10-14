import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";

const governance: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "kovan") {
				console.log("Kovan Deploy");
				const ATG = await deployments.getOrNull("ATG");
        const { log } = deployments;
        if (!ATG) {
            const ethers = hre.ethers;

            const namedAccounts = await hre.getNamedAccounts();
            const oneYear = 1640140333; // Wednesday, December 22, 2021 2:32:13 AM
            const threeDays = 259200;
            const [owner] = await ethers.getSigners();

            let nonce = await owner.getTransactionCount();
            const ATGAddress = ethers.utils.getContractAddress({
                from: namedAccounts.deployer,
                nonce: nonce++,
            });

            const timelockAddress = ethers.utils.getContractAddress({
                from: namedAccounts.deployer,
                nonce: nonce++,
            });

            const governorAddress = ethers.utils.getContractAddress({
                from: namedAccounts.deployer,
                nonce: nonce++,
            });

            const ATGDeployment = await deployments.deploy("ATG", {
                from: namedAccounts.deployer,
                args: [namedAccounts.deployer, timelockAddress, oneYear],
            });

            log(
                `ATG deployed at ${ATGDeployment.address} for ${ATGDeployment.receipt?.gasUsed}`
            );

            const timelockDeployment = await deployments.deploy("Timelock", {
                from: namedAccounts.deployer,
                args: [governorAddress, threeDays],
            });

            log(
                `Timelock deployed at ${timelockDeployment.address} for ${timelockDeployment.receipt?.gasUsed}`
            );

            const governorDeployment = await deployments.deploy(
                "GovernorAlpha",
                {
                    from: namedAccounts.deployer,
                    args: [timelockAddress, ATGAddress],
                }
            );

            log(
                `Governor Alpha deployed at ${governorDeployment.address} for ${governorDeployment.receipt?.gasUsed}`
            );
        } else {
            log("ATG Token already deployed");
        }
    }
};
export default governance;
