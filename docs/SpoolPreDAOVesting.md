# SpoolPreDAOVesting





Implementation of the {ISpoolPreDAOVesting} interface.

*This contract inherits BaseVesting, this is where most of the functionality is located.      It overrides some functions where necessary.*

## Methods

### begin

```solidity
function begin() external nonpayable
```

Allows the vesting period to be initiated.

*the storage variable &quot;total&quot; contains the total amount of the SPOOL token that is being vested. this is transferred from the SPOOL owner here.  Emits a {VestingInitialized} event from which the start and end can be calculated via it&#39;s attached timestamp.  Requirements: - the caller must be the owner - owner has given allowance for &quot;total&quot; to this contract*


### claim

```solidity
function claim() external nonpayable returns (uint256 vestedAmount)
```

Allows a user to claim their pending vesting amount.

*Requirements: - the vesting period has started - the caller must have a non-zero vested amount*


#### Returns

| Name | Type | Description |
|---|---|---|
| vestedAmount | uint256 | undefined

### end

```solidity
function end() external view returns (uint256)
```

timestamp of vesting end




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getClaim

```solidity
function getClaim() external view returns (uint256 vestedAmount)
```

Returns the amount a user can claim at a given point in time.

*Requirements: - the vesting period has started*


#### Returns

| Name | Type | Description |
|---|---|---|
| vestedAmount | uint256 | undefined

### setVests

```solidity
function setVests(address[] members, uint192[] amounts) external nonpayable
```

Allows vests to be set. 

*internally calls _setVests function on BaseVesting.                                                                                                     Can be called an arbitrary number of times before `begin()` is called  on the base contract.                                                 Requirements: - the caller must be the owner*

#### Parameters

| Name | Type | Description |
|---|---|---|
| members | address[] | array of addresses to set vesting for
| amounts | uint192[] | array of SPOOL token vesting amounts to to be set for each address

### spoolToken

```solidity
function spoolToken() external view returns (contract IERC20)
```

SPOOL token contract address, the token that is being vested.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20 | undefined

### start

```solidity
function start() external view returns (uint256)
```

timestamp of vesting start




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### total

```solidity
function total() external view returns (uint256)
```

total amount of SPOOL token vested




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### transferVest

```solidity
function transferVest(Member members, uint256 transferAmount) external nonpayable
```

Allows owner to transfer all or part of a vest from one address to another

*It allows for transfer of vest to any other address. However, in the case that the receiving address has any vested amount, it first checks for that, and if so, claims on behalf of that user, sending them any pending vested amount. This has to be done to ensure the vesting is fairly distributed. Emits a {Transferred} event indicating the members who were involved in the transfer as well as the amount that was transferred. Requirements: - the vesting period has started - specified transferAmount is not more than the previous member&#39;s vested amount *

#### Parameters

| Name | Type | Description |
|---|---|---|
| members | Member | members list - &quot;prev&quot; for member to transfer from, &quot;next&quot; for member to transfer to
| transferAmount | uint256 | amount of SPOOL token to transfer

### userVest

```solidity
function userVest(address) external view returns (uint192 amount, uint64 lastClaim)
```

map of member to Vest struct (see IBaseVesting)



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint192 | undefined
| lastClaim | uint64 | undefined

### vestingDuration

```solidity
function vestingDuration() external view returns (uint256)
```

the length of time (in seconds) the vesting is to last for.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### voSPOOL

```solidity
function voSPOOL() external view returns (contract IERC20Mintable)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20Mintable | undefined



## Events

### Transferred

```solidity
event Transferred(Member indexed members, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| members `indexed` | Member | undefined |
| amount  | uint256 | undefined |

### Vested

```solidity
event Vested(address indexed from, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| from `indexed` | address | undefined |
| amount  | uint256 | undefined |

### VestingInitialized

```solidity
event VestingInitialized(uint256 duration)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| duration  | uint256 | undefined |



