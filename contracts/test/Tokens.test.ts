import { expect, use } from "chai";
// @ts-ignore
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { solidity } from "ethereum-waffle";
import { USDT } from "../types";
import { deployFixture } from "./fixture";
use(solidity);

describe("Tokens Test", function () {
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;

  let usdtToken: USDT;

  const initialSupply = ethers.utils.parseUnits("1500000", "6");
  const mintAmount = ethers.utils.parseUnits("1000", "6");

  beforeEach("Setup for Tokens", async () => {
    const fixture = await loadFixture(deployFixture);
    [deployer, user] = await ethers.getSigners();

    usdtToken = await fixture.USDTTokenFactory.deploy(deployer.address);

    await usdtToken.deployed();
  });

  describe("Tokens", async function () {
    it("Should check variables of USDT Token", async function () {
      expect(await usdtToken.name()).to.be.equal("Tether");
      expect(await usdtToken.symbol()).to.be.equal("USDT");
      expect(await usdtToken.decimals()).to.be.equal(6);
      expect(await usdtToken.totalSupply()).to.be.equal(initialSupply);
    });
    
    it("Should let any one mint USDT Token", async function () {
      await usdtToken.connect(user).mint();
      expect(await usdtToken.balanceOf(user.address)).to.be.equal(mintAmount);
    });
  });
});
