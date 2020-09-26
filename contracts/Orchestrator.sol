// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/introspection/ERC165Checker.sol";
import "./IVaultHandler.sol";
import "./TCAP.sol";
import "./oracles/ChainlinkOracle.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

//DEBUG
import "@nomiclabs/buidler/console.sol";

/**
 * @title TCAP Orchestrator
 * @author Cristian Espinoza
 * @notice Orchestrator contract in charge of managing the settings of the vaults and TCAP token
 */
contract Orchestrator is Ownable {
  enum VaultFunctions {
    DIVISOR,
    RATIO,
    BURNFEE,
    LIQUIDATION,
    TCAP,
    TCAPORACLE,
    COLLATERAL,
    COLLATERALORACLE,
    ETHORACLE
  }
  /** @dev Vault address to initialized bool */
  mapping(IVaultHandler => bool) public initialized;
  /** @dev Mapping that checks if Function on vault is timelocked */
  mapping(IVaultHandler => mapping(VaultFunctions => uint256)) public timelock;
  /** @dev Mapping that checks if Function on vault is timelocked */
  mapping(IVaultHandler => mapping(VaultFunctions => bytes32))
    public timelockValue;
  /** @dev vault functions are timelocked for 3 days*/
  uint256 private constant _TIMELOCK = 3 days;

  /** @dev Interface constants*/
  bytes4 private constant _INTERFACE_ID_IVAULT = 0x409e4a0f;
  bytes4 private constant _INTERFACE_ID_TCAP = 0xa9ccee51;
  bytes4 private constant _INTERFACE_ID_CHAINLINK_ORACLE = 0x85be402b;

  /**
   * @notice Throws if vault is locked.
   * @param _vault address
   * @param _fn constant identifier
   */
  modifier notLocked(
    IVaultHandler _vault,
    VaultFunctions _fn,
    bytes32 _value
  ) {
    require(
      timelock[_vault][_fn] != 0 && timelock[_vault][_fn] <= now,
      "Function is timelocked"
    );
    require(timelockValue[_vault][_fn] == _value, "Not defined timelock value");
    _;
  }

  /**
   * @notice Throws if vault is not valid.
   * @param _vault address
   */
  modifier validVault(IVaultHandler _vault) {
    require(
      ERC165Checker.supportsInterface(address(_vault), _INTERFACE_ID_IVAULT),
      "Not a valid vault"
    );
    _;
  }

  /**
   * @notice Throws if TCAP Token is not valid.
   * @param _tcap address
   */
  modifier validTCAP(TCAP _tcap) {
    require(
      ERC165Checker.supportsInterface(address(_tcap), _INTERFACE_ID_TCAP),
      "Not a valid TCAP ERC20"
    );
    _;
  }

  /**
   * @notice Throws if Chainlink Oracle is not valid.
   * @param _oracle address
   */
  modifier validChainlinkOracle(address _oracle) {
    require(
      ERC165Checker.supportsInterface(
        address(_oracle),
        _INTERFACE_ID_CHAINLINK_ORACLE
      ),
      "Not a valid Chainlink Oracle"
    );
    _;
  }

  /**
   * @dev CREATED AS STACK IS TOO DEEP ON INITIALIZE
   * @notice Throws if Chainlink Oracle is not valid
   * @param _oracle address
   */
  function _validChainlinkOracle(address _oracle) private view {
    require(
      ERC165Checker.supportsInterface(
        address(_oracle),
        _INTERFACE_ID_CHAINLINK_ORACLE
      ),
      "Not a valid Chainlink Oracle"
    );
  }

  /**
   * @notice Intialize the Vault Contract
   * @param _vault address
   * @param _divisor uint256
   * @param _ratio uint256
   * @param _burnFee uint256
   * @param _liquidationPenalty uint256
   * @param _tcapOracle address
   * @param _tcapAddress address
   * @param _collateralAddress address
   * @param _collateralOracle address
   * @param _ethOracle address
   * @dev Only owner can call it
   * @dev Validates if contracts support their interface
   */
  function initializeVault(
    IVaultHandler _vault,
    uint256 _divisor,
    uint256 _ratio,
    uint256 _burnFee,
    uint256 _liquidationPenalty,
    address _tcapOracle,
    TCAP _tcapAddress,
    address _collateralAddress,
    address _collateralOracle,
    address _ethOracle
  ) public onlyOwner validVault(_vault) validTCAP(_tcapAddress) {
    require(!initialized[_vault], "Contract already initialized");
    _validChainlinkOracle(_tcapOracle);
    _validChainlinkOracle(_collateralOracle);
    _validChainlinkOracle(_ethOracle);
    _vault.initialize(
      _divisor,
      _ratio,
      _burnFee,
      _liquidationPenalty,
      _tcapOracle,
      _tcapAddress,
      _collateralAddress,
      _collateralOracle,
      _ethOracle
    );
    initialized[_vault] = true;
  }

  /**
   * @notice Unlocks vault function
   * @param _vault address
   * @param _fn to be unlocked
   * @dev Only owner can call it
   * @dev Unlock time is = now + _TIMELOCK
   */
  function unlockVaultFunction(
    IVaultHandler _vault,
    VaultFunctions _fn,
    bytes32 _hash
  ) public onlyOwner {
    timelock[_vault][_fn] = now + _TIMELOCK;
    timelockValue[_vault][_fn] = _hash;
    //TODO: log unlock
  }

  /**
   * @notice Locks vault function
   * @param _vault address
   * @param _fn to be unlocked
   * @dev Lock happens immediately
   */
  function _lockVaultFunction(IVaultHandler _vault, VaultFunctions _fn)
    private
  {
    timelock[_vault][_fn] = 0;
    timelockValue[_vault][_fn] = 0;
  }

  /**
   * @notice Locks vault function
   * @param _vault address
   * @param _fn to be unlocked
   * @dev Only owner can call it
   * @dev Lock happens immediately
   */
  function lockVaultFunction(IVaultHandler _vault, VaultFunctions _fn)
    public
    onlyOwner
  {
    _lockVaultFunction(_vault, _fn);
  }

  /**
   * @notice Sets the divisor of a vault
   * @param _vault address
   * @param _divisor value
   * @dev Only owner can call it
   * @dev Validates if _vault is valid and not locked
   * @dev Locks function after using
   */
  function setDivisor(IVaultHandler _vault, uint256 _divisor)
    public
    onlyOwner
    validVault(_vault)
    notLocked(
      _vault,
      VaultFunctions.DIVISOR,
      keccak256(abi.encodePacked(_divisor))
    )
  {
    _vault.setDivisor(_divisor);
    _lockVaultFunction(_vault, VaultFunctions.DIVISOR);
  }

  /**
   * @notice Sets the ratio of a vault
   * @param _vault address
   * @param _ratio value
   * @dev Only owner can call it
   * @dev Validates if _vault is valid and not locked
   * @dev Locks function after using
   */
  function setRatio(IVaultHandler _vault, uint256 _ratio)
    public
    onlyOwner
    validVault(_vault)
    notLocked(_vault, VaultFunctions.RATIO, keccak256(abi.encodePacked(_ratio)))
  {
    _vault.setRatio(_ratio);
    _lockVaultFunction(_vault, VaultFunctions.RATIO);
  }

  /**
   * @notice Sets the burn fee of a vault
   * @param _vault address
   * @param _burnFee value
   * @dev Only owner can call it
   * @dev Validates if _vault is valid and not locked
   * @dev Locks function after using
   */
  function setBurnFee(IVaultHandler _vault, uint256 _burnFee)
    public
    onlyOwner
    validVault(_vault)
    notLocked(
      _vault,
      VaultFunctions.BURNFEE,
      keccak256(abi.encodePacked(_burnFee))
    )
  {
    _vault.setBurnFee(_burnFee);
    _lockVaultFunction(_vault, VaultFunctions.BURNFEE);
  }

  /**
   * @notice Sets the liquidation penalty of a vault
   * @param _vault address
   * @param _liquidationPenalty value
   * @dev Only owner can call it
   * @dev Validates if _vault is valid and not locked
   * @dev Locks function after using
   */
  function setLiquidationPenalty(
    IVaultHandler _vault,
    uint256 _liquidationPenalty
  )
    public
    onlyOwner
    validVault(_vault)
    notLocked(
      _vault,
      VaultFunctions.LIQUIDATION,
      keccak256(abi.encodePacked(_liquidationPenalty))
    )
  {
    _vault.setLiquidationPenalty(_liquidationPenalty);
    _lockVaultFunction(_vault, VaultFunctions.LIQUIDATION);
  }

  /**
   * @notice Sets the TCAP ERC20 Contract
   * @param _vault address
   * @param _tcap contract address
   * @dev Only owner can call it
   * @dev Validates if _vault and tcap are valid and not locked
   * @dev Locks function after using
   */
  function setTCAP(IVaultHandler _vault, TCAP _tcap)
    public
    onlyOwner
    validVault(_vault)
    notLocked(_vault, VaultFunctions.TCAP, keccak256(abi.encodePacked(_tcap)))
    validTCAP(_tcap)
  {
    _vault.setTCAPContract(_tcap);
    _lockVaultFunction(_vault, VaultFunctions.TCAP);
  }

  /**
   * @notice Sets the TCAP Oracle Contract
   * @param _vault address
   * @param _tcapOracle contract address
   * @dev Only owner can call it
   * @dev Validates if _vault and oracle are valid and not locked
   * @dev Locks function after using
   */
  function setTCAPOracle(IVaultHandler _vault, address _tcapOracle)
    public
    onlyOwner
    validVault(_vault)
    notLocked(
      _vault,
      VaultFunctions.TCAPORACLE,
      keccak256(abi.encodePacked(_tcapOracle))
    )
    validChainlinkOracle(_tcapOracle)
  {
    _vault.setTCAPOracle(ChainlinkOracle(_tcapOracle));
    _lockVaultFunction(_vault, VaultFunctions.TCAPORACLE);
  }

  /**
   * @notice Sets the Collateral Contract
   * @param _vault address
   * @param _collateral contract address
   * @dev Only owner can call it
   * @dev Validates if _vault is valid and not locked
   * @dev Locks function after using
   */
  function setCollateral(IVaultHandler _vault, ERC20 _collateral)
    public
    onlyOwner
    validVault(_vault)
    notLocked(
      _vault,
      VaultFunctions.COLLATERAL,
      keccak256(abi.encodePacked(_collateral))
    )
  {
    _vault.setCollateralContract(_collateral);
    _lockVaultFunction(_vault, VaultFunctions.COLLATERAL);
  }

  /**
   * @notice Sets the Collateral Oracle Contract
   * @param _vault address
   * @param _collateralOracle contract address
   * @dev Only owner can call it
   * @dev Validates if _vault and oracle are valid and not locked
   * @dev Locks function after using
   */
  function setCollateralOracle(IVaultHandler _vault, address _collateralOracle)
    public
    onlyOwner
    validVault(_vault)
    notLocked(
      _vault,
      VaultFunctions.COLLATERALORACLE,
      keccak256(abi.encodePacked(_collateralOracle))
    )
    validChainlinkOracle(_collateralOracle)
  {
    _vault.setCollateralPriceOracle(ChainlinkOracle(_collateralOracle));
    _lockVaultFunction(_vault, VaultFunctions.COLLATERALORACLE);
  }

  /**
   * @notice Sets the ETH Price Oracle Contract
   * @param _vault address
   * @param _ethOracles contract address
   * @dev Only owner can call it
   * @dev Validates if _vault and oracle are valid and not locked
   * @dev Locks function after using
   */
  function setETHOracle(IVaultHandler _vault, address _ethOracles)
    public
    onlyOwner
    validVault(_vault)
    notLocked(
      _vault,
      VaultFunctions.ETHORACLE,
      keccak256(abi.encodePacked(_ethOracles))
    )
    validChainlinkOracle(_ethOracles)
  {
    _vault.setETHPriceOracle(ChainlinkOracle(_ethOracles));
    _lockVaultFunction(_vault, VaultFunctions.ETHORACLE);
  }

  /**
   * @notice Pauses the Vault
   * @param _vault address
   * @dev Only owner can call it
   * @dev Validates if _vault is valid
   */
  function pauseVault(IVaultHandler _vault)
    public
    onlyOwner
    validVault(_vault)
  {
    _vault.pause();
  }

  /**
   * @notice Unpauses the Vault
   * @param _vault address
   * @dev Only owner can call it
   * @dev Validates if _vault is valid
   */
  function unpauseVault(IVaultHandler _vault)
    public
    onlyOwner
    validVault(_vault)
  {
    _vault.unpause();
  }

  /**
   * @notice Retrieves a vault fees and put it on the Orchestrator
   * @param _vault address
   * @dev Only owner can call it
   * @dev Validates if _vault is valid
   */
  function retrieveVaultFees(IVaultHandler _vault)
    public
    onlyOwner
    validVault(_vault)
  {
    _vault.retrieveFees();
  }

  /**
   * @notice Retrieves the fees on the orchestrator
   * @dev Only owner can call it
   * @dev Transfer the balance to the contract owner
   */
  function retrieveFees() public onlyOwner {
    uint256 amount = address(this).balance;
    payable(owner()).transfer(amount);
  }

  /**
   * @notice Enables or disables the TCAP Cap
   * @param _tcap address
   * @param _enable bool
   * @dev Only owner can call it
   * @dev Validates if _tcap is valid
   */
  function enableTCAPCap(TCAP _tcap, bool _enable)
    public
    onlyOwner
    validTCAP(_tcap)
  {
    _tcap.enableCap(_enable);
  }

  /**
   * @notice Enables or disables the TCAP Cap
   * @param _tcap address
   * @param _cap uint value
   * @dev Only owner can call it
   * @dev Validates if _tcap is valid
   */
  function setTCAPCap(TCAP _tcap, uint256 _cap)
    public
    onlyOwner
    validTCAP(_tcap)
  {
    _tcap.setCap(_cap);
  }

  /**
   * @notice Adds Vault to TCAP ERC20
   * @param _tcap address
   * @param _vault address
   * @dev Only owner can call it
   * @dev Validates if _tcap is valid
   */
  function addTCAPVault(TCAP _tcap, IVaultHandler _vault)
    public
    onlyOwner
    validTCAP(_tcap)
    validVault(_vault)
  {
    _tcap.addTokenHandler(address(_vault));
  }

  receive() external payable {}

  // // // 0xa9ccee51
  // function calcStoreInterfaceId() external view returns (bytes4) {
  //   TCAP i;
  //   bytes4 x = i.mint.selector ^
  //     i.burn.selector ^
  //     i.setCap.selector ^
  //     i.enableCap.selector ^
  //     i.transfer.selector ^
  //     i.transferFrom.selector ^
  //     i.approve.selector ^
  //     i.addTokenHandler.selector;
  //   console.logBytes4(x);
  // }
}