// run with
// npx hardhat run ./scripts/CIP-7-10.ts --network hardhat
import hre, { deployments, network, hardhatArguments } from "hardhat";
import { castVote, createProposal, executeProposal, fundMultisign, queueProposal } from "./utils";
import { BigNumber } from "ethers";

async function main() {
	const ethers = hre.ethers;

	const amount = ethers.utils.parseEther("8100"); // TODO: update this
	const multisig = "0xa70b638B70154EdfCbb8DbbBd04900F328F32c35";
	let ATG = await deployments.get("ATG");
	let ATGContract = await ethers.getContractAt("ATG", ATG.address);
	let orchestratorAddress = "0x373C74BcE7893097ab26d22f05691907D4f2c18e";
	let HMKT = await deployments.get("HMKT");
	let HMKTContract = await ethers.getContractAt("HMKT", HMKT.address);

	const abi = new ethers.utils.AbiCoder();
	const targets = [ATG.address];
	const values = [BigNumber.from(0)];
	const signatures = ["transfer(address,uint256)"];
	const calldatas = [abi.encode(["address", "uint256"], [multisig, amount])];
	const description =
		"CIP-7: Airdrop early HMKT Testers, CIP-10 AstraTerra Community Grants Program Q4";
	console.log(targets);
	console.log(values);
	console.log(signatures);
	console.log(calldatas);
	console.log(description);

	let balance = await ATGContract.balanceOf(multisig);
	console.log("multisig old ATG balance", ethers.utils.formatEther(balance));

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
		balance = await ATGContract.balanceOf(multisig);
		console.log("Multisig new ATG balance", ethers.utils.formatEther(balance));
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
