import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments, hardhatArguments } from "hardhat";
import { ethers } from "ethers";

const maticHandler: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (hardhatArguments.network === "polygon") {
        const maticVault = await deployments.getOrNull("MATICVaultHandler");
        const { log } = deployments;
        if (!maticVault) {
            const namedAccounts = await hre.getNamedAccounts();
            const orchestratorDeployment = await deployments.get(
                "Orchestrator"
            );
            const HMKTDeployment = await deployments.get("HMKT");
            const HMKTOracleDeployment = await deployments.get("HMKTOracle");
            const maticOracleDeployment = await deployments.get("MATICOracle");

            // Params
            let orchestrator = orchestratorDeployment.address;
            let divisor = "10000000000";
            let ratio = "200";
            let burnFee = "1";
            let liquidationPenalty = "10";
            let HMKTOracle = HMKTOracleDeployment.address;
            let HMKTAddress = HMKTDeployment.address;
            let collateralAddress =
                "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
            let maticOracle = maticOracleDeployment.address;
            let rewardAddress = ethers.constants.AddressZero;
            let treasury = "0xf77E8426EceF4A44D5Ec8986FB525127BaD32Fd1"; // guardian address

            const maticVaultHandler = await deployments.deploy(
                "MATICVaultHandler",
                {
                    contract: "MATICVaultHandler",
                    from: namedAccounts.deployer,
                    args: [
                        orchestrator,
                        divisor,
                        ratio,
                        burnFee,
                        liquidationPenalty,
                        HMKTOracle,
                        HMKTAddress,
                        collateralAddress,
                        maticOracle,
                        maticOracle,
                        rewardAddress,
                        treasury,
                    ],
                    skipIfAlreadyDeployed: true,
                    log: true,
                }
            );
            log(
                `Matic Vault deployed at ${maticVaultHandler.address} for ${maticVaultHandler.receipt?.gasUsed}`
            );
        } else {
            log("Matic Vault already deployed");
        }
    }
};
export default maticHandler;
