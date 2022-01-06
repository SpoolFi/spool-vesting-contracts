# IBaseVesting





{IBaseVesting} interface.

*See {BaseVesting} for function descriptions.*

## Methods

### begin

```solidity
function begin() external nonpayable
```






### total

```solidity
function total() external view returns (int192)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | int192 | undefined



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



