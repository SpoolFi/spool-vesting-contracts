// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import "../external/@openzeppelin/token/ERC20/ERC20.sol";
import "../external/@openzeppelin/token/ERC20/IERC20.sol";
import "../external/@openzeppelin/token/ERC20/extensions/ERC20Pausable.sol";
import "../external/@openzeppelin/access/Ownable.sol";

import "../interfaces/IERC20Mintable.sol";
// TEST
contract MockToken is IERC20Mintable, ERC20Pausable, Ownable {
    uint8 private immutable _decimals;
    constructor(
        string memory _symbol,
        string memory _name,
        uint8 decimals_
    ) ERC20(_symbol, _name) ERC20Pausable() {
        _decimals = decimals_;
        mint(msg.sender, 1_000_000  * (10 ** _decimals));
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address account, uint256 amount) public override {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public override {
        _burn(account, amount);
    }

    /**
     * @dev Pause token transfers until unpaused.
     * Can only be called by the current owner.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token transfers.
     * Can only be called by the current owner.
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
