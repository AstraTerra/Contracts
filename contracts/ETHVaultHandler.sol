// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

import "./IVaultHandler.sol";
import "./Orchestrator.sol";
import "./IWETH.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title ETH HMKT Vault
 * @author AstraTerra.finance
 * @notice Contract in charge of handling the HMKT Vault and stake using a ETH and WETH
 */
contract ETHVaultHandler is IVaultHandler {
  /// @notice Open Zeppelin libraries
  using SafeMath for uint256;

  /**
   * @notice Constructor
   * @param _orchestrator address
   * @param _divisor uint256
   * @param _ratio uint256
   * @param _burnFee uint256
   * @param _liquidationPenalty uint256
   * @param _HMKTOracle address
   * @param _HMKTAddress address
   * @param _collateralAddress address
   * @param _collateralOracle address
   * @param _ethOracle address
   * @param _treasury address
   * @param _minimumHMKT uint256
   */
  constructor(
    Orchestrator _orchestrator,
    uint256 _divisor,
    uint256 _ratio,
    uint256 _burnFee,
    uint256 _liquidationPenalty,
    address _HMKTOracle,
    HMKT _HMKTAddress,
    address _collateralAddress,
    address _collateralOracle,
    address _ethOracle,
    address _treasury,
    uint256 _minimumHMKT
  )
    IVaultHandler(
      _orchestrator,
      _divisor,
      _ratio,
      _burnFee,
      _liquidationPenalty,
      _HMKTOracle,
      _HMKTAddress,
      _collateralAddress,
      _collateralOracle,
      _ethOracle,
      _treasury,
      _minimumHMKT
    )
  {}

  /**
   * @notice only accept ETH via fallback from the WETH contract
   */
  receive() external payable {
    assert(msg.sender == address(collateralContract));
  }

  /**
   * @notice Adds collateral to vault using ETH
   * @dev value should be higher than 0
   * @dev ETH is turned into WETH
   */
  function addCollateralETH()
    external
    payable
    nonReentrant
    vaultExists
    whenNotPaused
    whenNotDisabled(FunctionChoices.AddCollateral)
  {
    require(
      msg.value > 0,
      "ETHVaultHandler::addCollateralETH: value can't be 0"
    );
    IWETH(address(collateralContract)).deposit{value: msg.value}();
    Vault storage vault = vaults[userToVault[msg.sender]];
    vault.Collateral = vault.Collateral.add(msg.value);
    emit CollateralAdded(msg.sender, vault.Id, msg.value);
  }

  /**
   * @notice Removes not used collateral from vault
   * @param _amount of collateral to remove
   * @dev _amount should be higher than 0
   * @dev WETH is turned into ETH
   */
  function removeCollateralETH(uint256 _amount)
    external
    nonReentrant
    vaultExists
    whenNotPaused
    whenNotDisabled(FunctionChoices.RemoveCollateral)
  {
    require(
      _amount > 0,
      "ETHVaultHandler::removeCollateralETH: value can't be 0"
    );
    Vault storage vault = vaults[userToVault[msg.sender]];
    uint256 currentRatio = getVaultRatio(vault.Id);
    require(
      vault.Collateral >= _amount,
      "ETHVaultHandler::removeCollateralETH: retrieve amount higher than collateral"
    );
    vault.Collateral = vault.Collateral.sub(_amount);
    if (currentRatio != 0) {
      require(
        getVaultRatio(vault.Id) >= ratio,
        "ETHVaultHandler::removeCollateralETH: collateral below min required ratio"
      );
    }

    IWETH(address(collateralContract)).withdraw(_amount);
    safeTransferETH(msg.sender, _amount);
    emit CollateralRemoved(msg.sender, vault.Id, _amount);
  }
}
