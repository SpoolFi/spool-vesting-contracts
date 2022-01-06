import { expect, use } from "chai";
import { Wallet } from "ethers";
import { solidity } from "ethereum-waffle";
import {
  AccountsFixture,
  deploymentFixture,
  SPOOLFixture,
} from "./shared/fixtures";
import { ethers, waffle } from "hardhat";

use(solidity);

const createFixtureLoader = waffle.createFixtureLoader;

describe("voSPOOL ERC20 Token", () => {
  let wallet: Wallet, other: Wallet;
  let loadFixture: ReturnType<typeof createFixtureLoader>;
  before("create fixture loader", async () => {
    [wallet, other] = await (ethers as any).getSigners();
    loadFixture = createFixtureLoader([wallet, other]);
  });

  let accounts: AccountsFixture;
  let spool: SPOOLFixture;

  beforeEach("load fixtures", async () => {
    ({ accounts, spool } = await loadFixture(deploymentFixture));
  });

  it("Should have these properties set on deploy", async () => {
    const balance = await spool.voSPOOL.balanceOf(
      accounts.administrator.address
    );
    expect(balance).to.equal(ethers.constants.Zero);
    expect(await spool.voSPOOL.name()).to.equal("voSPOOL");
    expect(await spool.voSPOOL.symbol()).to.equal("Spool DAO Voting Token");
    expect(await spool.voSPOOL.authorized(spool.spoolPreDAOVesting.address)).to
      .be.true;
  });

  it("Should not allow SPOOL Staking to address 0", async () => {
    await expect(
      spool.voSPOOL.setAuthorized(ethers.constants.AddressZero, true)
    ).to.be.revertedWith(
      "voSPOOL::setAuthorized:: cannot add auth as zero address"
    );
  });

  it("Should set SPOOL Staking from owner account", async () => {
    let address = "0x0000000000000000000000000000000000000001";
    await spool.voSPOOL.setAuthorized(address, true);
    const actual = await spool.voSPOOL.authorized(address);
    expect(actual).to.be.true;
  });

  it("Should try to set minter from non-owner account", async () => {
    await expect(
      spool.voSPOOL
        .connect(accounts.user0)
        .setAuthorized(accounts.user0.address, true)
    ).to.be.revertedWith(
      "SpoolOwnable::_onlyOwner: Caller is not the Spool owner"
    );
  });

  it("Should not allow approve from voSPOOL", async () => {
    await expect(
      spool.voSPOOL.approve(accounts.user0.address, 1)
    ).to.be.revertedWith("voSPOOL::approve: Prohibited Action");
  });

  it("Should not allow transfer from voSPOOL", async () => {
    await expect(
      spool.voSPOOL.transfer(accounts.user0.address, 1)
    ).to.be.revertedWith("voSPOOL::transfer: Prohibited Action");
  });

  it("Should not allow transferFrom from voSPOOL", async () => {
    await expect(
      spool.voSPOOL.transferFrom(
        accounts.user0.address,
        accounts.user1.address,
        1
      )
    ).to.be.revertedWith("voSPOOL::transferFrom: Prohibited Action");
  });

  it("Should not allow increase allowance from voSPOOL", async () => {
    await expect(
      spool.voSPOOL.increaseAllowance(accounts.user0.address, 1)
    ).to.be.revertedWith("voSPOOL::increaseAllowance: Prohibited Action");
  });

  it("Should not allow decrease allowance from voSPOOL", async () => {
    await expect(
      spool.voSPOOL.decreaseAllowance(accounts.user0.address, 1)
    ).to.be.revertedWith("voSPOOL::decreaseAllowance: Prohibited Action");
  });

  it("Should mint and burn 1 voSPOOL from staking account to user 0", async () => {
    await spool.voSPOOL.setAuthorized(accounts.user1.address, true);
    await expect(
      spool.voSPOOL.connect(accounts.user1).mint(accounts.user0.address, 100)
    )
      .to.emit(spool.voSPOOL, "Transfer")
      .withArgs(ethers.constants.AddressZero, accounts.user0.address, 100);

    let balance = await spool.voSPOOL.balanceOf(accounts.user0.address);
    expect(balance).to.equal(100);

    await expect(
      spool.voSPOOL.connect(accounts.user1).burn(accounts.user0.address, 50)
    )
      .to.emit(spool.voSPOOL, "Transfer")
      .withArgs(accounts.user0.address, ethers.constants.AddressZero, 50);

    balance = await spool.voSPOOL.balanceOf(accounts.user0.address);
    expect(balance).to.equal(50);
  });

  it("Should try to mint from unauthorized account", async () => {
    await spool.voSPOOL.setAuthorized(accounts.user1.address, true);

    await expect(
      spool.voSPOOL.mint(accounts.user0.address, 100)
    ).to.be.revertedWith("voSPOOL::_onlyAuthorized: Insufficient Privileges");
  });
});
