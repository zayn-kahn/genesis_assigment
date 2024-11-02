import { expect, use } from "chai";
// @ts-ignore
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { deployFixture } from "./fixture";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { USDT, USDT_Vault } from "../types";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
use(solidity);

describe("USDT Vault Test", function () {
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;
  let unApprovedUser: SignerWithAddress;
  let deployer: SignerWithAddress;

  let usdt: USDT;
  let vault: USDT_Vault;

  const fundAmount: BigNumber = ethers.utils.parseUnits("10000", "6");
  const depositAmount: BigNumber = ethers.utils.parseUnits("100", "6");
  const withdrawAmount: BigNumber = ethers.utils.parseUnits("50", "6");
  const yieldAmount: BigNumber = ethers.utils.parseUnits("60", "6");
  let users: SignerWithAddress[];
  let rewardAmount: BigNumber;

  async function transferAndApprove() {
    await usdt.transfer(user1.address, fundAmount);
    await usdt.transfer(user2.address, fundAmount);
    await usdt.transfer(user3.address, fundAmount);
    await usdt.transfer(user4.address, fundAmount);

    await usdt
      .connect(deployer)
      .approve(vault.address, ethers.constants.MaxUint256);

    await usdt
      .connect(user1)
      .approve(vault.address, ethers.constants.MaxUint256);
    await usdt
      .connect(user2)
      .approve(vault.address, ethers.constants.MaxUint256);
    await usdt
      .connect(user3)
      .approve(vault.address, ethers.constants.MaxUint256);
    await usdt
      .connect(user4)
      .approve(vault.address, ethers.constants.MaxUint256);
  }

  async function depositAll() {
    await vault.connect(user1).deposit(depositAmount);
    await vault.connect(user2).deposit(depositAmount);
    await vault.connect(user3).deposit(depositAmount);
    await vault.connect(user4).deposit(depositAmount);
  }

  beforeEach("Setup for USDT Vault", async () => {
    const fixture = await loadFixture(deployFixture);
    [deployer, user1, user2, user3, user4, unApprovedUser] =
      await ethers.getSigners();
    users = [user1, user2, user3, user4];
    rewardAmount = yieldAmount.div(users.length);
    usdt = await fixture.USDTTokenFactory.connect(deployer).deploy(
      deployer.address
    );
    await usdt.deployed();

    vault = await fixture.VaultFactory.connect(deployer).deploy(usdt.address);
    await vault.deployed();
    await transferAndApprove();
    await usdt.transfer(unApprovedUser.address, depositAmount);
  });

  describe("Vault: usdtToken()", async function () {
    it("Should return correct usdt token address", async function () {
      expect(await vault.usdtToken()).to.be.equal(usdt.address);
    });
  });

  describe("Vault: deposit()", async function () {
    it("Should revert if zero amount is deposited", async function () {
      await expect(
        vault.connect(user1).deposit(ethers.constants.Zero)
      ).to.revertedWith("Vault__ZeroAmountNotAllowed");
    });

    it("Should emit deposit event", async function () {
      await expect(vault.connect(user1).deposit(depositAmount))
        .to.emit(vault, "Vault_Deposit")
        .withNamedArgs({
          user: user1.address,
          amount: depositAmount,
        });
    });

    it("Should deposit USDT tokens and update balance", async function () {
      await vault.connect(user1).deposit(depositAmount);
      const { amount: balance, yieldingStartedAt } = await vault.getUserDeposit(
        user1.address
      );
      const totalBalance = await vault.getTotalDeposits();
      expect(balance).to.be.equal(depositAmount);
      expect(yieldingStartedAt).to.be.equal(0);
      expect(totalBalance).to.be.equal(depositAmount);
    });

    it("Should update user deposit if amount is greater than previous deposit", async function () {
      await depositAll();
      let { amount: balance, yieldingStartedAt } = await vault.getUserDeposit(
        user1.address
      );
      expect(yieldingStartedAt).to.be.equal(0);
      await vault.connect(deployer).depositYieldGenerated(yieldAmount);
      await vault.connect(deployer).depositYieldGenerated(yieldAmount);
      await vault.connect(deployer).depositYieldGenerated(yieldAmount);

      await vault
        .connect(user1)
        .deposit(depositAmount.add(depositAmount).add(1));

      ({ amount: balance, yieldingStartedAt } = await vault.getUserDeposit(
        user1.address
      ));
      expect(balance).to.be.equal(depositAmount.mul(3).add(1));
    });
  });

  describe("Vault: withdraw()", async function () {
    it("Should revert if zero amount is withdraw", async function () {
      await vault.connect(user1).deposit(depositAmount);
      await expect(
        vault.connect(user1).withdraw(ethers.constants.Zero)
      ).to.revertedWith("Vault__ZeroAmountNotAllowed");
    });

    it("Should revert if amount is greater than deposit", async function () {
      await vault.connect(user1).deposit(depositAmount);
      await expect(
        vault.connect(user1).withdraw(depositAmount.add(1))
      ).to.revertedWith("Vault__InsufficientBalance");
    });

    it("Should emit withdraw event", async function () {
      await vault.connect(user1).deposit(depositAmount);
      await expect(vault.connect(user1).withdraw(withdrawAmount))
        .to.emit(vault, "Vault_Withdrawal")
        .withNamedArgs({
          user: user1.address,
          amount: withdrawAmount,
        });
    });

    it("Should withdraw USDT tokens and update balance", async function () {
      await vault.connect(user1).deposit(depositAmount);
      let { amount: balance } = await vault.getUserDeposit(user1.address);
      let totalBalance = await vault.getTotalDeposits();
      expect(balance).to.be.equal(depositAmount);
      expect(totalBalance).to.be.equal(depositAmount);

      await vault.connect(user1).withdraw(withdrawAmount);
      ({ amount: balance } = await vault.getUserDeposit(user1.address));
      totalBalance = await vault.getTotalDeposits();
      expect(balance).to.be.equal(depositAmount.sub(withdrawAmount));
      expect(totalBalance).to.be.equal(depositAmount.sub(withdrawAmount));
    });

    it("Should delete user deposit if amount is zero", async function () {
      await vault.connect(user1).deposit(depositAmount);
      await vault.connect(user1).withdraw(depositAmount);
      let { amount: balance } = await vault.getUserDeposit(user1.address);
      expect(balance).to.be.equal(0);
    });
  });

  describe("Vault: toggleClaim()", async function () {
    it("Should revert if non owner calls", async function () {
      await expect(vault.connect(user1).toggleClaim()).to.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("Should emit event and update claim status", async function () {
      let claimStatus = await vault.isClaimPaused();
      expect(claimStatus).to.be.equal(false);
      await vault.connect(deployer).toggleClaim();
      claimStatus = await vault.isClaimPaused();
      expect(claimStatus).to.be.equal(true);
      await expect(vault.connect(deployer).toggleClaim())
        .to.emit(vault, "Vault_isClaimPaused")
        .withArgs(false);
    });
  });

  describe("Vault: emergencyWithdraw()", async function () {
    it("Should revert if non owner calls", async function () {
      await expect(
        vault.connect(user1).emergencyWithdraw(user1.address)
      ).to.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert if no balance in contract", async function () {
      await expect(
        vault.connect(deployer).emergencyWithdraw(deployer.address)
      ).to.revertedWith("Vault__InsufficientBalance");
    });

    it("Should withdraw all funds", async function () {
      await depositAll();

      let totalBalance = await vault.getTotalDeposits();
      expect(totalBalance).to.be.equal(depositAmount.mul(4));
      await vault.connect(deployer).emergencyWithdraw(deployer.address);
      totalBalance = await usdt.balanceOf(vault.address);
      expect(totalBalance).to.be.equal(0);
    });

    it("Should emit Emergency withdraw event", async function () {
      await depositAll();

      await expect(vault.connect(deployer).emergencyWithdraw(deployer.address))
        .to.emit(vault, "Vault_EmergencyWithdrawal")
        .withArgs(deployer.address, depositAmount.mul(4));
    });
  });

  describe("Vault: depositYieldGenerated()", async function () {

    it("Should revert if non owner calls", async function () {
      await expect(
        vault.connect(user1).depositYieldGenerated(yieldAmount)
      ).to.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert if yield amount is zero", async function () {
      await expect(
        vault.connect(deployer).depositYieldGenerated(ethers.constants.Zero)
      ).to.revertedWith("Vault__ZeroAmountNotAllowed");
    });

    it("Should revert if no deposits found", async function () {
      await expect(
        vault.connect(deployer).depositYieldGenerated(yieldAmount)
      ).to.revertedWith("Vault__NoDepositsFound");
    });

    it("Should deposit yield generated and update states correctly", async function () {
      await depositAll();
      let totalBalance = await vault.getTotalDeposits();
      let currentYieldNo = await vault.currentYieldNo();
      let yieldGenerated = await vault.getYield(currentYieldNo);
      expect(totalBalance).to.be.equal(depositAmount.mul(4));
      expect(currentYieldNo).to.be.equal(0);
      expect(yieldGenerated.yieldPerUSDT).to.be.equal(0);
      expect(yieldGenerated.yieldGenerated).to.be.equal(0);

      await vault.connect(deployer).depositYieldGenerated(yieldAmount);
      totalBalance = await vault.getTotalDeposits();
      currentYieldNo = await vault.currentYieldNo();
      yieldGenerated = await vault.getYield(currentYieldNo);
      expect(currentYieldNo).to.be.equal(1);
      // const precisionNumerator = await vault
      //   .connect(deployer)
      //   .precisionNumerator();
      // expect(totalBalance).to.be.equal(depositAmount.mul(4).add(yieldAmount));
      // expect(yieldGenerated.yieldGenerated).to.be.equal(yieldAmount);
    });

    it("Should deposit yield emit event", async function () {
      await depositAll();
      const precisionNumerator = await vault
        .connect(deployer)
        .precisionNumerator();
      let totalBalance = await vault.getTotalDeposits();
      await expect(vault.connect(deployer).depositYieldGenerated(yieldAmount))
        .to.emit(vault, "Vault_DepositYieldGenerated")
        .withArgs(
          deployer.address,
          1,
          yieldAmount.mul(precisionNumerator).div(totalBalance)
        );
    });
  });

  describe("Vault: getUserReward() | claimReward()", async function () {
    it("Should return correct reward", async function () {
      await depositAll();
      await vault.connect(deployer).depositYieldGenerated(yieldAmount);

      for (let i = 0; i < users.length; i++) {
        let reward = await vault.connect(users[i]).getUserReward(users[i].address, 1);
        expect(reward).to.be.equal(rewardAmount);
      }
    });

    it("Should stop user claim reward if claim is paused", async function () {
      await depositAll();
      await vault.connect(deployer).depositYieldGenerated(yieldAmount);
      await vault.connect(deployer).toggleClaim();

      for (let i = 0; i < users.length; i++) {
        await expect(vault.connect(users[i]).claimReward()).to.be.revertedWith(
          "Vault__ClaimPaused"
        );
      }
    });

    it("Should revert if no reward to claim", async function () {
      await vault.connect(user1).deposit(depositAmount);
      await vault.connect(deployer).depositYieldGenerated(yieldAmount);

      await expect(vault.connect(user2).claimReward()).to.be.revertedWith(
        "Vault__NoRewardToClaim"
      );
      await expect(vault.connect(user3).claimReward()).to.be.revertedWith(
        "Vault__NoRewardToClaim"
      );
    });

    it("Should revert if not enough balance to claim", async function () {
      await depositAll();
      await vault.connect(deployer).depositYieldGenerated(yieldAmount);
      await vault.connect(deployer).emergencyWithdraw(deployer.address);

      await expect(vault.connect(user2).claimReward()).to.be.revertedWith(
        "Vault__InsufficientBalance"
      );
    });

    it("Should let user claim reward", async function () {
      await depositAll();
      await vault.connect(deployer).depositYieldGenerated(yieldAmount);

      for (let i = 0; i < users.length; i++) {
        let reward = await vault.connect(users[i]).getUserReward(users[i].address, 1);
        let balance = await usdt.balanceOf(users[i].address);
        expect(reward).to.be.equal(rewardAmount);
        await vault.connect(users[i]).claimReward();
        expect(await usdt.balanceOf(users[i].address)).to.be.equal(
          balance.add(reward)
        );
      }
    });
  });
});
