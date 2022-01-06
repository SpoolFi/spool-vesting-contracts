// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;


import "../external/spool-core/SpoolOwnable.sol";
import "../external/@openzeppelin/token/ERC20/ERC20.sol";

/* ========== STRUCTS ========== */

/**
 * @notice The voting SPOOL pseudo-ERC20 Implementation
 *
 * @dev An untransferable token implementation meant to be used by the
 * SPOOL Staking contract to mint the voting equivalent of the staked
 * token.
 */
contract voSPOOL is ERC20, SpoolOwnable {
    /* ========== STATE VARIABLES ========== */

    /// @notice the mapping of addresses allowed to mint/burn shares
    mapping(address => bool) public authorized;

    /* ========== CONSTRUCTOR ========== */

    /**
     * @notice Initializes the token and sets the contract owner
     *
     * @param spoolOwnable the spool owner contract that owns this contract
     */
    constructor(ISpoolOwner spoolOwnable) SpoolOwnable(spoolOwnable) ERC20("voSPOOL", "Spool DAO Voting Token") {}

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @dev Execution of function is prohibited to disallow token movement
     */
    function transfer(address, uint256) public override pure returns (bool) {
        revert("voSPOOL::transfer: Prohibited Action");
    }

    /**
     * @dev Execution of function is prohibited to disallow token movement
     */
    function transferFrom(
        address,
        address,
        uint256
    ) public override pure returns (bool) {
        revert("voSPOOL::transferFrom: Prohibited Action");
    }

    /**
     * @dev Execution of function is prohibited to disallow token movement
     */
    function approve(address, uint256) public override pure returns (bool) {
        revert("voSPOOL::approve: Prohibited Action");
    }

    /**
     * @dev Execution of function is prohibited to disallow token movement
     */
    function increaseAllowance(address, uint256)
        public
        override
        pure
        returns (bool)
    {
        revert("voSPOOL::increaseAllowance: Prohibited Action");
    }

    /**
     * @dev Execution of function is prohibited to disallow token movement
     */
    function decreaseAllowance(address, uint256)
        public
        override
        pure
        returns (bool)
    {
        revert("voSPOOL::decreaseAllowance: Prohibited Action");
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
     * @notice Mints the provided amount of tokens to the specified user.
     * 
     * @dev
     *
     * Requirements:
     *
     * - the caller must be authorized to mint
     *
     * @param to the address to mint tokens to
     * @param amount amount of tokens to mint to address
     */
    function mint(address to, uint256 amount) external onlyAuthorized {
        _mint(to, amount);
    }

    /**
     * @notice Burns the provided amount of tokens from the specified user.
     * 
     * @dev
     *
     * Requirements:
     *
     * - the caller must be authorized to burn
     *
     * @param from the address to burn tokens from
     * @param amount amount of tokens to burn from address
     */
    function burn(address from, uint256 amount) external onlyAuthorized {
        _burn(from, amount);
    }

    /**
     * @notice Allows owner to toggle authorization for an address to mint/burn tokens
     * 
     * @dev
     *
     * Requirements:
     *
     * - the caller must be the contract owner
     * - the address cannot be zero
     * 
     * @param auth the address to toggle authorization for
     * @param set whether to set authorization for address to true or false
     */
    function setAuthorized(address auth, bool set) external onlyOwner {
        require(auth != address(0), "voSPOOL::setAuthorized:: cannot add auth as zero address");
        authorized[auth] = set;
    }

    /* ========== PRIVATE FUNCTIONS ========== */

    /**
     * @notice Ensures the caller has authorization to perform actions with the onlyAuthorized modifier
     * 
     * @dev
     * 
     * Requirements:
     * - caller is set to true in the authorized mapping
     */
    function _onlyAuthorized() private view {
        require(
            authorized[msg.sender],
            "voSPOOL::_onlyAuthorized: Insufficient Privileges"
        );
    }

    /* ========== MODIFIERS ========== */

    /**
     * @notice onlyAuthorized modifier
     * 
     * @dev internally calls the _onlyAuthorized function and continues execution
     */
    modifier onlyAuthorized() {
        _onlyAuthorized();
        _;
    }
}
