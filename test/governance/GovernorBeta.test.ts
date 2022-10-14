import { expect } from "chai";
import { Contract, constants } from "ethers";
import { waffle } from "hardhat";

import { governanceFixture } from "./fixtures";
import { DELAY } from "./utils";

describe("GovernorBeta", () => {
	// waffle;
	// const provider = new MockProvider({
	// 	ganacheOptions: {
	// 		hardfork: "istanbul",
	// 		mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
	// 		gasLimit: 9999999,
	// 	},
	// });
	const [wallet] = waffle.provider.getWallets();
	const loadFixture = waffle.createFixtureLoader([wallet], waffle.provider);

	let ATG: Contract;
	let timelock: Contract;
	let governorBeta: Contract;
	beforeEach(async () => {
		const fixture = await loadFixture(governanceFixture);
		ATG = fixture.ATG;
		timelock = fixture.timelock;
		governorBeta = fixture.governorBeta;
	});

	it("...should test ATG", async () => {
		const balance = await ATG.balanceOf(wallet.address);
		const totalSupply = await ATG.totalSupply();
		expect(balance).to.be.eq(totalSupply);
	});

	it("...should set timelock", async () => {
		const admin = await timelock.admin();
		expect(admin).to.be.eq(governorBeta.address);
		const pendingAdmin = await timelock.pendingAdmin();
		expect(pendingAdmin).to.be.eq(constants.AddressZero);
		const delay = await timelock.delay();
		expect(delay).to.be.eq(DELAY);
	});

	it("...should set governor", async () => {
		const votingPeriod = await governorBeta.votingPeriod();
		expect(votingPeriod).to.be.eq(17280);
		const timelockAddress = await governorBeta.timelock();
		expect(timelockAddress).to.be.eq(timelock.address);
		const ATGFromGovernor = await governorBeta.ATG();
		expect(ATGFromGovernor).to.be.eq(ATG.address);
	});
});
