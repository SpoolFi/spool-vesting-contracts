import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export const SECS_DAY: number = 86400;
export const SECS_YEAR: number = SECS_DAY * 365;
export const DAO_VESTING_DURATION = BigNumber.from(SECS_YEAR);
export const BUILDERS_VESTING_DURATION = BigNumber.from(SECS_YEAR * 2);

export const parseUnits = ethers.utils.parseUnits;

export enum Percentage {
  Point_01,
  Point_001,
  Point_0001,
}

export async function increase(seconds: BigNumber) {
  await ethers.provider.send("evm_increaseTime", [Number(seconds.toString())]);
}

export function delta(value: BigNumber, precision: Percentage): number {
  return Number(
    value.div(
      precision == Percentage.Point_01
        ? 10000
        : precision == Percentage.Point_001
        ? 100000
        : 1000000
    )
  );
}

export function getAddresses(signers: SignerWithAddress[]): string[] {
  return signers.map((signer) => {
    return signer.address;
  });
}
