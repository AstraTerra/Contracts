// run with
// npx hardhat run ./scripts/CIP-11.ts --network hardhat
import hre, { deployments, network, hardhatArguments } from "hardhat";
import { castVote, createProposal, executeProposal, fundMultisign, queueProposal } from "./utils";
import { BigNumber } from "ethers";

async function main() {
	const ethers = hre.ethers;

	let orchestratorAddress = "0x373C74BcE7893097ab26d22f05691907D4f2c18e";
	let HMKT = await deployments.get("HMKT");
	let HMKTContract = await ethers.getContractAt("HMKT", HMKT.address);
	let aaveVault = await deployments.get("AaveVaultHandler");
	let linkVault = await deployments.get("LinkVaultHandler");

	const abi = new ethers.utils.AbiCoder();
	const targets = [orchestratorAddress, orchestratorAddress];
	const values = [BigNumber.from(0), BigNumber.from(0)];
	const signatures = ["addHMKTVault(address,address)", "addHMKTVault(address,address)"];
	const calldatas = [
		abi.encode(["address", "address"], [HMKT.address, aaveVault.address]),
		abi.encode(["address", "address"], [HMKT.address, linkVault.address]),
	];
	const description = "CIP-11: Add AAVE and LINK Vaults";
	console.log(targets);
	console.log(values);
	console.log(signatures);
	console.log(calldatas);
	console.log(description);

	let aaveStatus = await HMKTContract.vaultHandlers(aaveVault.address);
	console.log(aaveStatus);

	let linkStatus = await HMKTContract.vaultHandlers(linkVault.address);
	console.log(linkStatus);

	if (hardhatArguments.network === "hardhat") {
		//Fund Multisign with ETH
		await fundMultisign("10000000000000000000");

		// Create Proposal
		await createProposal(targets, values, signatures, calldatas, description);

		// Vote
		await castVote(4, true);

		// Wait to queue
		await queueProposal(4);

		// Execute transaction
		await executeProposal(4);

		// Validate Results
		console.log("==================Check Results==================");

		aaveStatus = await HMKTContract.vaultHandlers(aaveVault.address);
		console.log(aaveStatus);
		linkStatus = await HMKTContract.vaultHandlers(linkVault.address);
		console.log(linkStatus);
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
