var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("Orchestrator Contract", async function () {
	let orchestratorInstance,
		HMKTInstance,
		HMKTInstance2,
		ethVaultInstance,
		btcVaultInstance,
		wethTokenInstance;
	let [owner, addr1, handler, handler2, guardian] = [];
	let accounts = [];
	let divisor = "10000000000";
	let ratio = "150";
	let burnFee = "1";
	let liquidationPenalty = "10";
	let HMKTOracle = (collateralAddress = collateralOracle = ethOracle =
		ethersProvider.constants.AddressZero);

	before("Set Accounts", async () => {
		let [acc0, acc1, acc3, acc4, acc5, acc6] = await ethers.getSigners();
		owner = acc0;
		addr1 = acc1;
		handler = acc3;
		handler2 = acc4;
		guardian = acc6;
		if (owner && addr1 && handler) {
			accounts.push(await owner.getAddress());
			accounts.push(await addr1.getAddress());
			accounts.push(await handler.getAddress());
			accounts.push(await handler2.getAddress());
			accounts.push(await acc5.getAddress());
		}
	});

	it("...should deploy the contract", async () => {
		const orchestrator = await ethers.getContractFactory("Orchestrator");
		orchestratorInstance = await orchestrator.deploy(await guardian.getAddress());
		await orchestratorInstance.deployed();
		expect(orchestratorInstance.address).properAddress;

		//HMKT
		const HMKT = await ethers.getContractFactory("HMKT");
		HMKTInstance = await HMKT.deploy(
			"Total Market Cap Token",
			"HMKT",
			18,
			orchestratorInstance.address
		);
		await HMKTInstance.deployed();
		HMKTInstance2 = await HMKT.deploy(
			"Total Market Cap Token",
			"HMKT2",
			18,
			orchestratorInstance.address
		);
		await HMKTInstance2.deployed();
		//Chainlink Oracles
		const aggregator = await ethers.getContractFactory("AggregatorInterface");
		let aggregatorInstance = await aggregator.deploy();
		const oracle = await ethers.getContractFactory("ChainlinkOracle");
		let chainlinkInstance = await oracle.deploy(aggregatorInstance.address, accounts[0]);
		await chainlinkInstance.deployed();
		HMKTOracle = chainlinkInstance.address;
		chainlinkInstance = await oracle.deploy(aggregatorInstance.address, accounts[0]);
		await chainlinkInstance.deployed();
		collateralOracle = chainlinkInstance.address;
		chainlinkInstance = await oracle.deploy(aggregatorInstance.address, accounts[0]);
		await chainlinkInstance.deployed();
		ethOracle = chainlinkInstance.address;
		//Collateral
		const weth = await ethers.getContractFactory("WETH");
		wethTokenInstance = await weth.deploy();
		collateralAddress = wethTokenInstance.address;

		//Timelock
		const threeDays = 359200;
		const timelock = await ethers.getContractFactory("Timelock");
		const timelockInstance = await timelock.deploy(orchestratorInstance.address, threeDays);

		//Vaults
		const wethVault = await ethers.getContractFactory("ERC20VaultHandler");
		ethVaultInstance = await wethVault.deploy(
			orchestratorInstance.address,
			divisor,
			ratio,
			burnFee,
			liquidationPenalty,
			HMKTOracle,
			HMKTInstance.address,
			collateralAddress,
			collateralOracle,
			ethOracle,
			timelockInstance.address,
			0
		);
		await ethVaultInstance.deployed();
		expect(ethVaultInstance.address).properAddress;

		btcVaultInstance = await wethVault.deploy(
			orchestratorInstance.address,
			divisor,
			ratio,
			burnFee,
			liquidationPenalty,
			HMKTOracle,
			HMKTInstance.address,
			collateralAddress,
			collateralOracle,
			ethOracle,
			timelockInstance.address,
			0
		);
		await btcVaultInstance.deployed();
		expect(btcVaultInstance.address).properAddress;
	});

	it("...should set the owner", async () => {
		const defaultOwner = await orchestratorInstance.owner();
		expect(defaultOwner).to.eq(accounts[0]);
	});

	it("...should set the guardian", async () => {
		const currentGuardian = await orchestratorInstance.guardian();
		expect(currentGuardian).to.eq(await guardian.getAddress());

		await expect(
			orchestratorInstance.connect(addr1).setGuardian(await addr1.getAddress())
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.connect(owner).setGuardian(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Orchestrator::setGuardian: guardian can't be zero");

		await expect(orchestratorInstance.connect(owner).setGuardian(await addr1.getAddress()))
			.to.emit(orchestratorInstance, "GuardianSet")
			.withArgs(await owner.getAddress(), await addr1.getAddress());

		await orchestratorInstance.setGuardian(await guardian.getAddress());
	});

	it("...should set vault ratio", async () => {
		let ratio = "190";

		await expect(
			orchestratorInstance.connect(addr1).setRatio(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setRatio(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await orchestratorInstance.setRatio(ethVaultInstance.address, ratio);
		expect(ratio).to.eq(await ethVaultInstance.ratio());

		await expect(orchestratorInstance.setRatio(ethVaultInstance.address, 10)).to.be.revertedWith(
			"VaultHandler::setRatio: ratio lower than MIN_RATIO"
		);
	});

	it("...should set vault burn fee", async () => {
		let burnFee = "2";

		await expect(
			orchestratorInstance.connect(addr1).setBurnFee(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setBurnFee(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await orchestratorInstance.setBurnFee(ethVaultInstance.address, burnFee);
		expect(burnFee).to.eq(await ethVaultInstance.burnFee());

		await expect(orchestratorInstance.setBurnFee(ethVaultInstance.address, 1001)).to.be.revertedWith(
			"VaultHandler::setBurnFee: burn fee higher than MAX_FEE"
		);
	});

	it("...should set vault liquidation penalty", async () => {
		let liquidationPenalty = "15";

		await expect(
			orchestratorInstance.connect(addr1).setLiquidationPenalty(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setLiquidationPenalty(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await orchestratorInstance.setLiquidationPenalty(ethVaultInstance.address, liquidationPenalty);
		expect(liquidationPenalty).to.eq(await ethVaultInstance.liquidationPenalty());
	});

	it("...should prevent liquidation penalty + 100 to be above ratio", async () => {
		let liquidationPenalty = "90";

		await expect(
			orchestratorInstance.setLiquidationPenalty(ethVaultInstance.address, liquidationPenalty)
		).to.be.revertedWith("VaultHandler::setLiquidationPenalty: liquidation penalty too high");
	});

	it("...should pause the Vault", async () => {
		await expect(
			orchestratorInstance.connect(owner).pauseVault(ethVaultInstance.address)
		).to.be.revertedWith("Orchestrator::onlyGuardian: caller is not the guardian");

		await expect(
			orchestratorInstance.connect(guardian).pauseVault(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await orchestratorInstance.connect(guardian).pauseVault(ethVaultInstance.address);
		expect(true).to.eq(await ethVaultInstance.paused());

		await expect(
			orchestratorInstance.connect(guardian).pauseVault(ethVaultInstance.address)
		).to.be.revertedWith("Orchestrator::pauseVault: emergency call already used");
		await orchestratorInstance.connect(guardian).pauseVault(btcVaultInstance.address);
		expect(true).to.eq(await btcVaultInstance.paused());
	});

	it("...should unpause the vault", async () => {
		await expect(
			orchestratorInstance.connect(owner).unpauseVault(ethVaultInstance.address)
		).to.be.revertedWith("Orchestrator::onlyGuardian: caller is not the guardian");

		await expect(
			orchestratorInstance.connect(guardian).unpauseVault(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await orchestratorInstance.connect(guardian).unpauseVault(ethVaultInstance.address);
		expect(false).to.eq(await ethVaultInstance.paused());
	});

	it("...should set the liquidation penalty to 0 on emergency", async () => {
		await expect(
			orchestratorInstance.connect(owner).setEmergencyLiquidationPenalty(ethVaultInstance.address)
		).to.be.revertedWith("Orchestrator::onlyGuardian: caller is not the guardian");
		await expect(
			orchestratorInstance
				.connect(guardian)
				.setEmergencyLiquidationPenalty(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");
		await orchestratorInstance
			.connect(guardian)
			.setEmergencyLiquidationPenalty(ethVaultInstance.address);
		expect(await ethVaultInstance.liquidationPenalty()).to.eq(0);
		await expect(
			orchestratorInstance
				.connect(guardian)
				.setEmergencyLiquidationPenalty(ethVaultInstance.address)
		).to.be.revertedWith(
			"Orchestrator::setEmergencyLiquidationPenalty: emergency call already used"
		);
		await orchestratorInstance
			.connect(guardian)
			.setEmergencyLiquidationPenalty(btcVaultInstance.address);
		expect(await btcVaultInstance.liquidationPenalty()).to.eq(0);
	});

	it("...should set the burn fee to 0 on emergency", async () => {
		await expect(
			orchestratorInstance.connect(owner).setEmergencyBurnFee(ethVaultInstance.address)
		).to.be.revertedWith("Orchestrator::onlyGuardian: caller is not the guardian");
		await expect(
			orchestratorInstance
				.connect(guardian)
				.setEmergencyBurnFee(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await orchestratorInstance.connect(guardian).setEmergencyBurnFee(ethVaultInstance.address);
		expect(await ethVaultInstance.burnFee()).to.eq(0);
		await expect(
			orchestratorInstance.connect(guardian).setEmergencyBurnFee(ethVaultInstance.address)
		).to.be.revertedWith("Orchestrator::setEmergencyBurnFee: emergency call already used");
		await orchestratorInstance.connect(guardian).setEmergencyBurnFee(btcVaultInstance.address);
		expect(await btcVaultInstance.burnFee()).to.eq(0);
	});

	it("...should be able to send funds to owner of orchestrator", async () => {
		await expect(orchestratorInstance.connect(addr1).retrieveETH(accounts[0])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);

		await orchestratorInstance.retrieveETH(accounts[0]);
	});

	it("...should enable the HMKT cap", async () => {
		let enableCap = true;

		await expect(
			orchestratorInstance.connect(addr1).enableHMKTCap(HMKTInstance.address, false)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.enableHMKTCap(ethersProvider.constants.AddressZero, false)
		).to.be.revertedWith("Orchestrator::validHMKT: not a valid HMKT ERC20");

		await expect(orchestratorInstance.enableHMKTCap(HMKTInstance.address, enableCap))
			.to.emit(HMKTInstance, "NewCapEnabled")
			.withArgs(orchestratorInstance.address, enableCap);

		expect(enableCap).to.eq(await HMKTInstance.capEnabled());
	});

	it("...should set the HMKT cap", async () => {
		let HMKTCap = 100;

		await expect(
			orchestratorInstance.connect(addr1).setHMKTCap(HMKTInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setHMKTCap(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Orchestrator::validHMKT: not a valid HMKT ERC20");

		await expect(orchestratorInstance.setHMKTCap(HMKTInstance.address, HMKTCap))
			.to.emit(HMKTInstance, "NewCap")
			.withArgs(orchestratorInstance.address, HMKTCap);

		expect(HMKTCap).to.eq(await HMKTInstance.cap());
	});

	it("...should add vault to HMKT token", async () => {
		await expect(
			orchestratorInstance
				.connect(addr1)
				.addHMKTVault(HMKTInstance.address, ethVaultInstance.address)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.addHMKTVault(
				ethersProvider.constants.AddressZero,
				ethVaultInstance.address
			)
		).to.be.revertedWith("Orchestrator::validHMKT: not a valid HMKT ERC20");

		await expect(
			orchestratorInstance.addHMKTVault(HMKTInstance.address, ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await expect(orchestratorInstance.addHMKTVault(HMKTInstance.address, ethVaultInstance.address))
			.to.emit(HMKTInstance, "VaultHandlerAdded")
			.withArgs(orchestratorInstance.address, ethVaultInstance.address);

		expect(await HMKTInstance.vaultHandlers(ethVaultInstance.address)).to.eq(true);
	});

	it("...should remove vault to HMKT token", async () => {
		await expect(
			orchestratorInstance
				.connect(addr1)
				.removeHMKTVault(HMKTInstance.address, ethVaultInstance.address)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.removeHMKTVault(
				ethersProvider.constants.AddressZero,
				ethVaultInstance.address
			)
		).to.be.revertedWith("Orchestrator::validHMKT: not a valid HMKT ERC20");

		await expect(
			orchestratorInstance.removeHMKTVault(
				HMKTInstance.address,
				ethersProvider.constants.AddressZero
			)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await expect(
			orchestratorInstance.removeHMKTVault(HMKTInstance.address, ethVaultInstance.address)
		)
			.to.emit(HMKTInstance, "VaultHandlerRemoved")
			.withArgs(orchestratorInstance.address, ethVaultInstance.address);

		expect(await HMKTInstance.vaultHandlers(ethVaultInstance.address)).to.eq(false);
	});

	it("...should allow to execute a custom transaction", async () => {
		await orchestratorInstance.addHMKTVault(HMKTInstance.address, ethVaultInstance.address);

		let currentOwner = await HMKTInstance.owner();
		expect(currentOwner).to.eq(orchestratorInstance.address);
		const newOwner = await addr1.getAddress();
		const abi = new ethers.utils.AbiCoder();
		const target = HMKTInstance.address;
		const value = 0;
		const signature = "transferOwnership(address)";
		const data = abi.encode(["address"], [newOwner]);

		await expect(
			orchestratorInstance.connect(addr1).executeTransaction(target, value, signature, data)
		).to.be.revertedWith("Ownable: caller is not the owner");

		const wrongData = abi.encode(["address"], [ethers.constants.AddressZero]);
		await expect(
			orchestratorInstance.executeTransaction(target, value, signature, wrongData)
		).to.be.revertedWith("Orchestrator::executeTransaction: Transaction execution reverted.");

		await expect(orchestratorInstance.executeTransaction(target, value, signature, data))
			.to.emit(orchestratorInstance, "TransactionExecuted")
			.withArgs(target, value, signature, data);

		currentOwner = await HMKTInstance.owner();
		expect(currentOwner).to.eq(newOwner);
	});
});
