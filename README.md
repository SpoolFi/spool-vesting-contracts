# Spool DAO Contracts

The implementation of the vesting and voting functionalities for the Spool DAO.

## Overview

### Voting

- The voting contract (`voSPOOL`) is a simple, non-transferable ERC20 token. It's purpose is to provide Spool DAO members with the ability to vote on proposals.

- The token can only be minted/burned from a particular set of addresses (`authorized`), controlled by the Spool DAO.

- The PreDAO vesting contract in the following section is one of those.

- Other addresses can be added to `authorized` as the DAO sees fit. For example, the SPOOL staking contract will be added as one.

### Vesting

- The vesting contracts unlock `SPOOL` tokens linearly over a defined period (2 years). There are differences to how the different vesting contract implementations work.

- The PreDAO vesting works as follows;

  - If a user has a certain amount of `SPOOL` vested, they are minted the equivalent amount of tokens in `voSPOOL` when the vesting is set (the voting token).
  - As the two year linear vesting progresses, users can claim their unlocked `SPOOL`, in which case the equivalent amount of `voSPOOL` is burned.

- Builders vesting simply vests linearly over two years. They do NOT get `voSPOOL` tokens minted to their address.

- The Spool DAO has the ability to initially add, and also transfer, user vests.

## Run

### Install dependencies

- `npm install`

### Run tests

- `npm run compile`
- `npm run test`

### Run coverage report

- `npm run coverage`
- `xdg-open coverage/index.html`
