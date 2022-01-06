import { ethers } from "hardhat";

// types
import { VoSPOOL } from "../../build/types/VoSPOOL";
import { MockToken } from "../../build/types/MockToken";
import { SpoolPreDAOVesting } from "../../build/types/SpoolPreDAOVesting";
import { SpoolBuildersVesting } from "../../build/types/SpoolBuildersVesting";

// factories
import { ISpoolOwner__factory } from "../../build/types/factories/ISpoolOwner__factory";
import { VoSPOOL__factory } from "../../build/types/factories/VoSPOOL__factory";
import { MockToken__factory } from "../../build/types/factories/MockToken__factory";
import { SpoolPreDAOVesting__factory } from "../../build/types/factories/SpoolPreDAOVesting__factory";
import { SpoolBuildersVesting__factory } from "../../build/types/factories/SpoolBuildersVesting__factory";

import { Fixture, deployMockContract, MockContract } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DAO_VESTING_DURATION, BUILDERS_VESTING_DURATION } from "./utilities";

// ***** Interfaces *****
export interface AccountsFixture {
  administrator: SignerWithAddress;
  user0: SignerWithAddress;
  user1: SignerWithAddress;
  user2: SignerWithAddress;
  user3: SignerWithAddress;
  user4: SignerWithAddress;
}

export interface SPOOLFixture {
  token: MockToken;
  voSPOOL: VoSPOOL;
  spoolPreDAOVesting: SpoolPreDAOVesting;
  spoolBuildersVesting: SpoolBuildersVesting;
  mockSpoolOwner: MockContract;
}

export interface DeploymentFixture {
  accounts: AccountsFixture;
  spool: SPOOLFixture;
}
// ***** Interfaces *****

// ***** Fixtures *****
async function accountsFixture(): Promise<AccountsFixture> {
  const administrator = (await ethers.getSigners())[0];
  const user0 = (await ethers.getSigners())[1];
  const user1 = (await ethers.getSigners())[2];
  const user2 = (await ethers.getSigners())[3];
  const user3 = (await ethers.getSigners())[4];
  const user4 = (await ethers.getSigners())[5];

  return {
    administrator,
    user0,
    user1,
    user2,
    user3,
    user4,
  };
}

async function SPOOLFixture(
  accounts: AccountsFixture,
  token: MockToken
): Promise<SPOOLFixture> {
  const SpoolPreDAOVestingFactory =
    await new SpoolPreDAOVesting__factory().connect(accounts.administrator);
  const spoolBuildersVestingFactory =
    await new SpoolBuildersVesting__factory().connect(accounts.administrator);
  const VoSPOOLFactory = await new VoSPOOL__factory().connect(
    accounts.administrator
  );

  // Deploy Spool Owner contract
  const mockSpoolOwner = await deployMockContract(
    accounts.administrator,
    ISpoolOwner__factory.abi
  );
  await mockSpoolOwner.mock.isSpoolOwner.returns(false);
  await mockSpoolOwner.mock.isSpoolOwner
    .withArgs(accounts.administrator.address)
    .returns(true);

  // Deploy Voting SPOOL
  const voSPOOL = await VoSPOOLFactory.deploy(mockSpoolOwner.address);

  // Deploy SPOOL DAO Vesting
  const spoolPreDAOVesting = await SpoolPreDAOVestingFactory.deploy(
    mockSpoolOwner.address,
    voSPOOL.address,
    token.address,
    DAO_VESTING_DURATION
  );

  // Deploy SPOOL Builders Vesting
  const spoolBuildersVesting = await spoolBuildersVestingFactory.deploy(
    mockSpoolOwner.address,
    token.address,
    BUILDERS_VESTING_DURATION
  );

  // set DAO Vesting contract as authorized on voSPOOL
  await voSPOOL.setAuthorized(spoolPreDAOVesting.address, true);

  return {
    token,
    voSPOOL,
    spoolPreDAOVesting,
    spoolBuildersVesting,
    mockSpoolOwner,
  };
}

// ***** Fixtures *****

// ***** main fixture *****
export const deploymentFixture: Fixture<DeploymentFixture> =
  async function (): Promise<DeploymentFixture> {
    const accounts = await accountsFixture();

    const SpoolDaoTokenFactory = await new MockToken__factory().connect(
      accounts.administrator
    );
    const SPOOLToken = await SpoolDaoTokenFactory.deploy("SPOOL", "SPOOL", 18);

    const spool = await SPOOLFixture(accounts, SPOOLToken);

    return { accounts, spool };
  };
// ***** main fixture *****
