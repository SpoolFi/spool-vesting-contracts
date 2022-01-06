import { expect, use } from "chai";
import { BigNumber, Wallet } from "ethers";
import { solidity } from "ethereum-waffle";
import {
  AccountsFixture,
  deploymentFixture,
  SPOOLFixture,
} from "./shared/fixtures";
import { ethers, waffle } from "hardhat";
import {
  increase,
  Percentage,
  delta,
  getAddresses,
  DAO_VESTING_DURATION,
  BUILDERS_VESTING_DURATION,
} from "./shared/utilities";
import { parseUnits } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

// types
import { MemberStruct } from "../build/types/SpoolPreDAOVesting";

// factories
import { SpoolPreDAOVesting__factory } from "../build/types/factories/SpoolPreDAOVesting__factory";
import { SpoolBuildersVesting__factory } from "../build/types/factories/SpoolBuildersVesting__factory";

use(solidity);

const createFixtureLoader = waffle.createFixtureLoader;

describe("Vesting", () => {
  let wallet: Wallet, other: Wallet;
  let loadFixture: ReturnType<typeof createFixtureLoader>;
  before("create fixture loader", async () => {
    [wallet, other] = await (ethers as any).getSigners();
    loadFixture = createFixtureLoader([wallet, other]);
  });

  let accounts: AccountsFixture;
  let spool: SPOOLFixture;

  let daoMembers: SignerWithAddress[];
  let buildersMembers: SignerWithAddress[];
  let daoAmounts: BigNumber[];
  let buildersAmounts: BigNumber[];

  beforeEach("load fixtures", async () => {
    ({ accounts, spool } = await loadFixture(deploymentFixture));
    daoMembers = [accounts.user0, accounts.user1];
    buildersMembers = [accounts.user2, accounts.user3];
    daoAmounts = [parseUnits("100"), parseUnits("200")];
    buildersAmounts = [parseUnits("300"), parseUnits("400")];
  });

  describe("Gatekeeping tests", () => {
    it("should fail deploying vesting contracts with incorrect address", async () => {
      const SpoolPreDAOVestingFactory =
        await new SpoolPreDAOVesting__factory().connect(accounts.administrator);
      const SpoolBuildersVestingFactory =
        await new SpoolBuildersVesting__factory().connect(
          accounts.administrator
        );

      await expect(
        SpoolPreDAOVestingFactory.deploy(
          spool.mockSpoolOwner.address,
          spool.voSPOOL.address,
          ethers.constants.AddressZero,
          DAO_VESTING_DURATION
        )
      ).to.be.revertedWith("BaseVesting::constructor: Incorrect Token");

      await expect(
        SpoolBuildersVestingFactory.deploy(
          spool.mockSpoolOwner.address,
          ethers.constants.AddressZero,
          BUILDERS_VESTING_DURATION
        )
      ).to.be.revertedWith("BaseVesting::constructor: Incorrect Token");
    });

    it("should prevent claim/getClaim before vesting has begun", async () => {
      await expect(spool.spoolPreDAOVesting.claim()).to.be.revertedWith(
        "BaseVesting::_checkStarted: Vesting hasn't started yet"
      );
      await expect(spool.spoolBuildersVesting.claim()).to.be.revertedWith(
        "BaseVesting::_checkStarted: Vesting hasn't started yet"
      );

      await expect(spool.spoolPreDAOVesting.getClaim()).to.be.revertedWith(
        "BaseVesting::_checkStarted: Vesting hasn't started yet"
      );
      await expect(spool.spoolBuildersVesting.getClaim()).to.be.revertedWith(
        "BaseVesting::_checkStarted: Vesting hasn't started yet"
      );
    });
  });

  describe("Commence vesting deployment failure tests", () => {
    it("should prevent owner controlled functions from non-owner", async () => {
      await expect(
        spool.spoolPreDAOVesting
          .connect(accounts.user0)
          .setVests(getAddresses(daoMembers), daoAmounts)
      ).to.be.revertedWith(
        "SpoolOwnable::_onlyOwner: Caller is not the Spool owner"
      );

      await expect(
        spool.spoolBuildersVesting
          .connect(accounts.user0)
          .setVests(getAddresses(buildersMembers), buildersAmounts)
      ).to.be.revertedWith(
        "SpoolOwnable::_onlyOwner: Caller is not the Spool owner"
      );
      await expect(
        spool.spoolPreDAOVesting.connect(accounts.user0).begin()
      ).to.be.revertedWith(
        "SpoolOwnable::_onlyOwner: Caller is not the Spool owner"
      );
      await expect(
        spool.spoolBuildersVesting.connect(accounts.user0).begin()
      ).to.be.revertedWith(
        "SpoolOwnable::_onlyOwner: Caller is not the Spool owner"
      );

      const members: MemberStruct = {
        prev: accounts.user0.address,
        next: accounts.user1.address,
      };
      await expect(
        spool.spoolBuildersVesting
          .connect(accounts.user0)
          .transferVest(members, 100)
      ).to.be.revertedWith(
        "SpoolOwnable::_onlyOwner: Caller is not the Spool owner"
      );
      await expect(
        spool.spoolPreDAOVesting
          .connect(accounts.user0)
          .transferVest(members, 100)
      ).to.be.revertedWith(
        "SpoolOwnable::_onlyOwner: Caller is not the Spool owner"
      );
    });
    it("should prevent begin vesting with wrong length arguments", async () => {
      await expect(
        spool.spoolPreDAOVesting.setVests(
          [accounts.administrator.address],
          daoAmounts
        )
      ).to.be.revertedWith("BaseVesting::_setVests: Incorrect Arguments");
      await expect(
        spool.spoolBuildersVesting.setVests(
          [accounts.administrator.address],
          buildersAmounts
        )
      ).to.be.revertedWith("BaseVesting::_setVests: Incorrect Arguments");
      await expect(
        spool.spoolPreDAOVesting.setVests(getAddresses(daoMembers), [100])
      ).to.be.revertedWith("BaseVesting::_setVests: Incorrect Arguments");
      await expect(
        spool.spoolBuildersVesting.setVests(getAddresses(buildersMembers), [
          100,
        ])
      ).to.be.revertedWith("BaseVesting::_setVests: Incorrect Arguments");
    });

    it("should prevent set vests trying to add the same member twice", async () => {
      daoMembers.push(daoMembers[1]);
      daoAmounts.push(daoAmounts[1]);
      await expect(
        spool.spoolPreDAOVesting.setVests(getAddresses(daoMembers), daoAmounts)
      ).to.be.revertedWith("BaseVesting::_setVests: Members Not Unique");
    });
  });

  describe("Commence vesting failure tests", () => {
    beforeEach("begin vesting from owner account", async () => {
      await spool.spoolPreDAOVesting.setVests(
        getAddresses(daoMembers),
        daoAmounts
      );
      await spool.spoolBuildersVesting.setVests(
        getAddresses(buildersMembers),
        buildersAmounts
      );

      await spool.token.approve(
        spool.spoolPreDAOVesting.address,
        await spool.spoolPreDAOVesting.total()
      );
      await spool.token.approve(
        spool.spoolBuildersVesting.address,
        await spool.spoolBuildersVesting.total()
      );

      await spool.spoolPreDAOVesting.begin();
      await spool.spoolBuildersVesting.begin();
    });

    it("should prevent begin vesting again after start", async () => {
      await expect(spool.spoolPreDAOVesting.begin()).to.be.revertedWith(
        "BaseVesting::_checkStarted: Vesting has already started"
      );
    });

    it("should prevent begin set vests again after start", async () => {
      await expect(
        spool.spoolPreDAOVesting.setVests(getAddresses(daoMembers), daoAmounts)
      ).to.be.revertedWith(
        "BaseVesting::_checkStarted: Vesting has already started"
      );
    });

    it("should assert that total is correct", async () => {
      const totals = [
        daoAmounts[0].add(daoAmounts[1]),
        buildersAmounts[0].add(buildersAmounts[1]),
      ];

      expect(await spool.spoolPreDAOVesting.total()).to.equal(totals[0]);
      expect(await spool.spoolBuildersVesting.total()).to.equal(totals[1]);

      expect(
        await spool.token.balanceOf(spool.spoolPreDAOVesting.address)
      ).to.equal(totals[0]);
      expect(
        await spool.token.balanceOf(spool.spoolBuildersVesting.address)
      ).to.equal(totals[1]);
    });
    it("should get claim of 0 from user accounts", async () => {
      expect(await spool.spoolPreDAOVesting.getClaim()).to.equal(0);
      expect(await spool.spoolBuildersVesting.getClaim()).to.equal(0);
    });
    it("should revert when claim amount is 0", async () => {
      await expect(spool.spoolPreDAOVesting.claim()).to.be.revertedWith(
        "BaseVesting::claim: Nothing to claim"
      );
      await expect(spool.spoolBuildersVesting.claim()).to.be.revertedWith(
        "BaseVesting::claim: Nothing to claim"
      );
    });

    it("should prevent transfer vest where prev is non-vested account", async () => {
      let members: MemberStruct = {
        prev: buildersMembers[0].address,
        next: buildersMembers[1].address,
      };
      await expect(
        spool.spoolPreDAOVesting.transferVest(members, 100)
      ).to.be.revertedWith(
        "BaseVesting::transferVest: invalid amount specified for transferring vest"
      );

      members = { prev: daoMembers[0].address, next: daoMembers[1].address };
      await expect(
        spool.spoolBuildersVesting.transferVest(members, 100)
      ).to.be.revertedWith(
        "BaseVesting::transferVest: invalid amount specified for transferring vest"
      );
    });

    it("should prevent transfer vest of amount 0", async () => {
      let members: MemberStruct = {
        prev: buildersMembers[0].address,
        next: buildersMembers[1].address,
      };
      await expect(
        spool.spoolPreDAOVesting.transferVest(members, 0)
      ).to.be.revertedWith(
        "BaseVesting::transferVest: invalid amount specified for transferring vest"
      );
    });
  });

  describe("Commence paused SpoolDAOToken tests", () => {
    beforeEach("set vests and pause spool DAO Token", async () => {
      await spool.spoolPreDAOVesting.setVests(
        getAddresses(daoMembers),
        daoAmounts
      );
      await spool.spoolBuildersVesting.setVests(
        getAddresses(buildersMembers),
        buildersAmounts
      );

      await spool.token.approve(
        spool.spoolPreDAOVesting.address,
        await spool.spoolPreDAOVesting.total()
      );
      await spool.token.approve(
        spool.spoolBuildersVesting.address,
        await spool.spoolBuildersVesting.total()
      );
      await spool.token.pause();
    });

    it("should prevent begin vesting while paused", async () => {
      await expect(spool.spoolPreDAOVesting.begin()).to.be.revertedWith(
        "ERC20Pausable: token transfer while paused"
      );
      await expect(spool.spoolBuildersVesting.begin()).to.be.revertedWith(
        "ERC20Pausable: token transfer while paused"
      );
    });

    it("should unpause and begin vests", async () => {
      await spool.token.unpause();
      await spool.spoolPreDAOVesting.begin();
      await spool.spoolBuildersVesting.begin();
    });
  });

  describe("Commence multiple set vesting tests", () => {
    beforeEach("begin vesting from owner account", async () => {
      await spool.spoolPreDAOVesting.setVests(
        getAddresses(daoMembers),
        daoAmounts
      );

      await spool.spoolBuildersVesting.setVests(
        getAddresses(buildersMembers),
        buildersAmounts
      );
    });
    it("should change daoMember amount and correctly update total", async () => {
      let total = await spool.spoolPreDAOVesting.total();
      expect(total).to.be.equal(daoAmounts[0].add(daoAmounts[1]));
      let firstUserVOSpoolBalance = await spool.voSPOOL.balanceOf(
        daoMembers[0].address
      );
      let secondUserVOSpoolBalance = await spool.voSPOOL.balanceOf(
        daoMembers[1].address
      );

      expect(firstUserVOSpoolBalance).to.be.equal(daoAmounts[0]);
      expect(secondUserVOSpoolBalance).to.be.equal(daoAmounts[1]);

      daoAmounts[1] = parseUnits("0");
      await spool.spoolPreDAOVesting.setVests(
        getAddresses(daoMembers),
        daoAmounts
      );
      total = await spool.spoolPreDAOVesting.total();
      expect(total).to.be.equal(daoAmounts[0].add(daoAmounts[1]));

      firstUserVOSpoolBalance = await spool.voSPOOL.balanceOf(
        daoMembers[0].address
      );
      secondUserVOSpoolBalance = await spool.voSPOOL.balanceOf(
        daoMembers[1].address
      );

      expect(firstUserVOSpoolBalance).to.be.equal(daoAmounts[0]);
      expect(secondUserVOSpoolBalance).to.be.equal(daoAmounts[1]);
    });

    it("should add a member and correctly update total", async () => {
      let total = await spool.spoolBuildersVesting.total();
      expect(total).to.be.equal(buildersAmounts[0].add(buildersAmounts[1]));

      let newMember = accounts.user4;

      let firstUserVOSpoolBalance = await spool.voSPOOL.balanceOf(
        buildersMembers[0].address
      );
      let secondUserVOSpoolBalance = await spool.voSPOOL.balanceOf(
        buildersMembers[1].address
      );

      // should have 0 voSPOOL balance in builders vesting
      expect(firstUserVOSpoolBalance).to.be.equal(0);
      expect(secondUserVOSpoolBalance).to.be.equal(0);

      buildersMembers.push(newMember);
      buildersAmounts.push(daoAmounts[1]);
      await spool.spoolBuildersVesting.setVests(
        getAddresses(buildersMembers),
        buildersAmounts
      );
      total = await spool.spoolBuildersVesting.total();
      expect(total).to.be.equal(
        buildersAmounts[0].add(buildersAmounts[1]).add(daoAmounts[1])
      );
    });
  });

  describe("Commence vesting running tests", () => {
    beforeEach("begin vesting from owner account", async () => {
      await spool.spoolPreDAOVesting.setVests(
        getAddresses(daoMembers),
        daoAmounts
      );
      await spool.spoolBuildersVesting.setVests(
        getAddresses(buildersMembers),
        buildersAmounts
      );

      await spool.token.approve(
        spool.spoolPreDAOVesting.address,
        await spool.spoolPreDAOVesting.total()
      );
      await spool.token.approve(
        spool.spoolBuildersVesting.address,
        await spool.spoolBuildersVesting.total()
      );

      await spool.spoolPreDAOVesting.begin();
      await spool.spoolBuildersVesting.begin();
    });

    it("should increase time for DAO Vesting and claim", async () => {
      await increase(DAO_VESTING_DURATION.div(3));
      await spool.spoolPreDAOVesting.connect(accounts.user0).claim();
      await spool.spoolPreDAOVesting.connect(accounts.user1).claim();

      let timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        (await spool.spoolPreDAOVesting.userVest(accounts.user0.address))
          .lastClaim
      ).be.be.equal(timestamp - 1);
      expect(
        (await spool.spoolPreDAOVesting.userVest(accounts.user1.address))
          .lastClaim
      ).be.be.equal(timestamp);

      let firstUserBalance = await spool.token.balanceOf(
        accounts.user0.address
      );
      let secondUserBalance = await spool.token.balanceOf(
        accounts.user1.address
      );
      expect(firstUserBalance).to.be.closeTo(
        daoAmounts[0].div(3),
        delta(firstUserBalance, Percentage.Point_0001)
      );
      expect(secondUserBalance).to.be.closeTo(
        daoAmounts[1].div(3),
        delta(secondUserBalance, Percentage.Point_0001)
      );

      await increase(DAO_VESTING_DURATION.div(3));
      await spool.spoolPreDAOVesting.connect(accounts.user0).claim();
      await spool.spoolPreDAOVesting.connect(accounts.user1).claim();

      timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        (await spool.spoolPreDAOVesting.userVest(accounts.user0.address))
          .lastClaim
      ).be.be.equal(timestamp - 1);
      expect(
        (await spool.spoolPreDAOVesting.userVest(accounts.user1.address))
          .lastClaim
      ).be.be.equal(timestamp);

      firstUserBalance = await spool.token.balanceOf(accounts.user0.address);
      secondUserBalance = await spool.token.balanceOf(accounts.user1.address);
      expect(firstUserBalance).to.be.closeTo(
        daoAmounts[0].div(3).mul(2),
        delta(firstUserBalance, Percentage.Point_0001)
      );
      expect(secondUserBalance).to.be.closeTo(
        daoAmounts[1].div(3).mul(2),
        delta(secondUserBalance, Percentage.Point_0001)
      );

      await increase(DAO_VESTING_DURATION.div(3));
      await spool.spoolPreDAOVesting.connect(accounts.user0).claim();
      await spool.spoolPreDAOVesting.connect(accounts.user1).claim();

      timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        (await spool.spoolPreDAOVesting.userVest(accounts.user0.address))
          .lastClaim
      ).be.be.equal(timestamp - 1);
      expect(
        (await spool.spoolPreDAOVesting.userVest(accounts.user1.address))
          .lastClaim
      ).be.be.equal(timestamp);

      firstUserBalance = await spool.token.balanceOf(accounts.user0.address);
      secondUserBalance = await spool.token.balanceOf(accounts.user1.address);
      expect(firstUserBalance).to.be.closeTo(
        daoAmounts[0],
        delta(firstUserBalance, Percentage.Point_0001)
      );
      expect(secondUserBalance).to.be.closeTo(
        daoAmounts[1],
        delta(secondUserBalance, Percentage.Point_0001)
      );

      await increase(BigNumber.from(1));
      await expect(
        spool.spoolPreDAOVesting.connect(accounts.user0).claim()
      ).to.be.revertedWith("BaseVesting::claim: Nothing to claim");
      await expect(
        spool.spoolPreDAOVesting.connect(accounts.user1).claim()
      ).to.be.revertedWith("BaseVesting::claim: Nothing to claim");
    });

    it("should increase time for Builder Vesting and claim", async () => {
      await increase(BUILDERS_VESTING_DURATION.div(3));

      await spool.spoolBuildersVesting.connect(buildersMembers[0]).claim();
      await spool.spoolBuildersVesting.connect(buildersMembers[1]).claim();

      let timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        (await spool.spoolBuildersVesting.userVest(buildersMembers[0].address))
          .lastClaim
      ).be.be.equal(timestamp - 1);
      expect(
        (await spool.spoolBuildersVesting.userVest(buildersMembers[1].address))
          .lastClaim
      ).be.be.equal(timestamp);

      let firstUserBalance = await spool.token.balanceOf(
        buildersMembers[0].address
      );
      let secondUserBalance = await spool.token.balanceOf(
        buildersMembers[1].address
      );
      expect(firstUserBalance).to.be.closeTo(
        buildersAmounts[0].div(3),
        delta(firstUserBalance, Percentage.Point_0001)
      );
      expect(secondUserBalance).to.be.closeTo(
        buildersAmounts[1].div(3),
        delta(secondUserBalance, Percentage.Point_0001)
      );

      await increase(BUILDERS_VESTING_DURATION.div(3));
      await spool.spoolBuildersVesting.connect(buildersMembers[0]).claim();
      await spool.spoolBuildersVesting.connect(buildersMembers[1]).claim();

      timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        (await spool.spoolBuildersVesting.userVest(buildersMembers[0].address))
          .lastClaim
      ).be.be.equal(timestamp - 1);
      expect(
        (await spool.spoolBuildersVesting.userVest(buildersMembers[1].address))
          .lastClaim
      ).be.be.equal(timestamp);

      firstUserBalance = await spool.token.balanceOf(
        buildersMembers[0].address
      );
      secondUserBalance = await spool.token.balanceOf(
        buildersMembers[1].address
      );
      expect(firstUserBalance).to.be.closeTo(
        buildersAmounts[0].div(3).mul(2),
        delta(firstUserBalance, Percentage.Point_0001)
      );
      expect(secondUserBalance).to.be.closeTo(
        buildersAmounts[1].div(3).mul(2),
        delta(secondUserBalance, Percentage.Point_0001)
      );

      await increase(BUILDERS_VESTING_DURATION.div(3));
      await spool.spoolBuildersVesting.connect(buildersMembers[0]).claim();
      await spool.spoolBuildersVesting.connect(buildersMembers[1]).claim();

      timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        (await spool.spoolBuildersVesting.userVest(buildersMembers[0].address))
          .lastClaim
      ).be.be.equal(timestamp - 1);
      expect(
        (await spool.spoolBuildersVesting.userVest(buildersMembers[1].address))
          .lastClaim
      ).be.be.equal(timestamp);

      firstUserBalance = await spool.token.balanceOf(
        buildersMembers[0].address
      );
      secondUserBalance = await spool.token.balanceOf(
        buildersMembers[1].address
      );
      expect(firstUserBalance).to.be.closeTo(
        buildersAmounts[0],
        delta(firstUserBalance, Percentage.Point_0001)
      );
      expect(secondUserBalance).to.be.closeTo(
        buildersAmounts[1],
        delta(secondUserBalance, Percentage.Point_0001)
      );

      await increase(BigNumber.from(1));
      await expect(
        spool.spoolBuildersVesting.connect(buildersMembers[0]).claim()
      ).to.be.revertedWith("BaseVesting::claim: Nothing to claim");
      await expect(
        spool.spoolBuildersVesting.connect(buildersMembers[1]).claim()
      ).to.be.revertedWith("BaseVesting::claim: Nothing to claim");
    });

    it("should increase time for DAO Vesting and claim with full vest transfer to existing vested member", async () => {
      await increase(DAO_VESTING_DURATION.div(3));
      await spool.spoolPreDAOVesting.connect(daoMembers[0]).claim();
      await spool.spoolPreDAOVesting.connect(daoMembers[1]).claim();

      let timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        (await spool.spoolPreDAOVesting.userVest(daoMembers[0].address))
          .lastClaim
      ).be.be.equal(timestamp - 1);
      expect(
        (await spool.spoolPreDAOVesting.userVest(daoMembers[1].address))
          .lastClaim
      ).be.be.equal(timestamp);

      let firstUserBalance = await spool.token.balanceOf(daoMembers[0].address);
      let secondUserBalance = await spool.token.balanceOf(
        daoMembers[1].address
      );
      expect(firstUserBalance).to.be.closeTo(
        daoAmounts[0].div(3),
        delta(firstUserBalance, Percentage.Point_0001)
      );
      expect(secondUserBalance).to.be.closeTo(
        daoAmounts[1].div(3),
        delta(secondUserBalance, Percentage.Point_0001)
      );

      const firstUserVest = await spool.spoolPreDAOVesting.userVest(
        daoMembers[0].address
      );
      let members: MemberStruct = {
        prev: daoMembers[0].address,
        next: daoMembers[1].address,
      };
      await spool.spoolPreDAOVesting.transferVest(
        members,
        firstUserVest.amount
      );
      expect(await spool.voSPOOL.balanceOf(daoMembers[0].address)).to.be.equal(
        0
      );
      let voSpoolBalance = await spool.voSPOOL.balanceOf(daoMembers[1].address);
      expect(voSpoolBalance).to.be.closeTo(
        daoAmounts[1].div(3).mul(2).add(firstUserVest.amount),
        delta(voSpoolBalance, Percentage.Point_0001)
      );

      await increase(DAO_VESTING_DURATION.div(3));
      await expect(
        spool.spoolPreDAOVesting.connect(daoMembers[0]).claim()
      ).to.be.revertedWith("BaseVesting::claim: Nothing to claim");
      await spool.spoolPreDAOVesting.connect(daoMembers[1]).claim();

      timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        (await spool.spoolPreDAOVesting.userVest(daoMembers[1].address))
          .lastClaim
      ).be.be.equal(timestamp);

      secondUserBalance = await spool.token.balanceOf(daoMembers[1].address);
      expect(secondUserBalance).to.be.closeTo(
        daoAmounts[0].div(3).add(daoAmounts[1].div(3).mul(2)),
        delta(secondUserBalance, Percentage.Point_0001)
      );

      await increase(DAO_VESTING_DURATION.div(3));
      await spool.spoolPreDAOVesting.connect(daoMembers[1]).claim();

      timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        (await spool.spoolPreDAOVesting.userVest(daoMembers[1].address))
          .lastClaim
      ).be.be.equal(timestamp);

      secondUserBalance = await spool.token.balanceOf(daoMembers[1].address);
      expect(secondUserBalance).to.be.closeTo(
        daoAmounts[0].div(3).mul(2).add(daoAmounts[1]),
        delta(secondUserBalance, Percentage.Point_0001)
      );

      await increase(BigNumber.from(1));
      await expect(
        spool.spoolPreDAOVesting.connect(daoMembers[0]).claim()
      ).to.be.revertedWith("BaseVesting::claim: Nothing to claim");
      await expect(
        spool.spoolPreDAOVesting.connect(daoMembers[1]).claim()
      ).to.be.revertedWith("BaseVesting::claim: Nothing to claim");
    });

    it("should increase time for Builders Vesting and claim with half vest transfer to new member", async () => {
      await increase(BUILDERS_VESTING_DURATION.div(3));
      await spool.spoolBuildersVesting.connect(buildersMembers[0]).claim();
      await spool.spoolBuildersVesting.connect(buildersMembers[1]).claim();

      let timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        (await spool.spoolBuildersVesting.userVest(buildersMembers[0].address))
          .lastClaim
      ).be.be.equal(timestamp - 1);
      expect(
        (await spool.spoolBuildersVesting.userVest(buildersMembers[1].address))
          .lastClaim
      ).be.be.equal(timestamp);

      const newMember = accounts.user4;
      let firstUserBalance = await spool.token.balanceOf(
        buildersMembers[0].address
      );
      let secondUserBalance = await spool.token.balanceOf(
        buildersMembers[1].address
      );
      let newMemberBalance = await spool.token.balanceOf(newMember.address);
      expect(firstUserBalance).to.be.closeTo(
        buildersAmounts[0].div(3),
        delta(firstUserBalance, Percentage.Point_0001)
      );
      expect(secondUserBalance).to.be.closeTo(
        buildersAmounts[1].div(3),
        delta(secondUserBalance, Percentage.Point_0001)
      );
      expect(newMemberBalance).to.equal(0);

      const secondUserVest = await spool.spoolBuildersVesting.userVest(
        buildersMembers[1].address
      );
      let members: MemberStruct = {
        prev: buildersMembers[1].address,
        next: newMember.address,
      };
      await spool.spoolBuildersVesting.transferVest(
        members,
        secondUserVest.amount.div(2)
      );

      await increase(BUILDERS_VESTING_DURATION.div(3));
      await spool.spoolBuildersVesting.connect(buildersMembers[0]).claim();
      await spool.spoolBuildersVesting.connect(buildersMembers[1]).claim();
      await spool.spoolBuildersVesting.connect(newMember).claim();

      timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        (await spool.spoolBuildersVesting.userVest(buildersMembers[0].address))
          .lastClaim
      ).be.be.equal(timestamp - 2);
      expect(
        (await spool.spoolBuildersVesting.userVest(buildersMembers[1].address))
          .lastClaim
      ).be.be.equal(timestamp - 1);
      expect(
        (await spool.spoolBuildersVesting.userVest(newMember.address)).lastClaim
      ).be.be.equal(timestamp);

      firstUserBalance = await spool.token.balanceOf(
        buildersMembers[0].address
      );
      secondUserBalance = await spool.token.balanceOf(
        buildersMembers[1].address
      );
      newMemberBalance = await spool.token.balanceOf(newMember.address);

      expect(firstUserBalance).to.be.closeTo(
        buildersAmounts[0].div(3).mul(2),
        delta(firstUserBalance, Percentage.Point_0001)
      );

      expect(secondUserBalance).to.be.closeTo(
        buildersAmounts[1].div(3).add(buildersAmounts[1].div(6)),
        delta(secondUserBalance, Percentage.Point_0001)
      );

      expect(newMemberBalance).to.be.closeTo(
        buildersAmounts[1].div(6),
        delta(newMemberBalance, Percentage.Point_0001)
      );

      await increase(BUILDERS_VESTING_DURATION.div(3));
      await spool.spoolBuildersVesting.connect(buildersMembers[0]).claim();
      await spool.spoolBuildersVesting.connect(buildersMembers[1]).claim();
      await spool.spoolBuildersVesting.connect(newMember).claim();

      timestamp = (await ethers.provider.getBlock("latest")).timestamp;
      expect(
        (await spool.spoolBuildersVesting.userVest(buildersMembers[0].address))
          .lastClaim
      ).be.be.equal(timestamp - 2);
      expect(
        (await spool.spoolBuildersVesting.userVest(buildersMembers[1].address))
          .lastClaim
      ).be.be.equal(timestamp - 1);
      expect(
        (await spool.spoolBuildersVesting.userVest(newMember.address)).lastClaim
      ).be.be.equal(timestamp);

      firstUserBalance = await spool.token.balanceOf(
        buildersMembers[0].address
      );
      secondUserBalance = await spool.token.balanceOf(
        buildersMembers[1].address
      );
      newMemberBalance = await spool.token.balanceOf(newMember.address);

      expect(firstUserBalance).to.be.closeTo(
        buildersAmounts[0],
        delta(firstUserBalance, Percentage.Point_0001)
      );

      expect(secondUserBalance).to.be.closeTo(
        buildersAmounts[1].div(3).add(buildersAmounts[1].div(3)),
        delta(secondUserBalance, Percentage.Point_0001)
      );

      expect(newMemberBalance).to.be.closeTo(
        buildersAmounts[1].div(3),
        delta(newMemberBalance, Percentage.Point_0001)
      );

      await increase(BigNumber.from(1));
      await expect(
        spool.spoolBuildersVesting.connect(buildersMembers[0]).claim()
      ).to.be.revertedWith("BaseVesting::claim: Nothing to claim");
      await expect(
        spool.spoolBuildersVesting.connect(buildersMembers[1]).claim()
      ).to.be.revertedWith("BaseVesting::claim: Nothing to claim");

      await expect(
        spool.spoolBuildersVesting.connect(newMember).claim()
      ).to.be.revertedWith("BaseVesting::claim: Nothing to claim");
    });
  });
});
