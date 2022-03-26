# Spool Vesting Contracts

The implementation of the vesting functionalities for the Spool DAO.

## Overview

- The vesting contracts unlock `SPOOL` tokens linearly over a defined period (2 years). There are differences to how the different vesting contract implementations work.

- The **PreDAO vesting** works as follows;

  - If a user has a certain amount of `SPOOL` vested, they are minted the equivalent amount of tokens in `voSPOOL` when the vesting is set (the voting token).
  - As the two year linear vesting progresses, users can claim their unlocked `SPOOL`, in which case the equivalent amount of `voSPOOL` is burned.

- The **Builders vesting** simply vests linearly over two years. They do NOT get `voSPOOL` tokens minted to their address.

- The Spool DAO has the ability to initially add, and also transfer, user vests.

## Run

### Install dependencies

- `npm install`

### Run tests

- `npm run compile`
- `npm run test`

### Run coverage report

- `npm run coverage`
