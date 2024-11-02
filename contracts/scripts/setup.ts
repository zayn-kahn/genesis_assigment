// @ts-ignore
import { ethers } from "hardhat";
import { USDT, USDT_Vault } from "../types";
import { vault, usdt } from "./addresses/31337.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

async function setUp() {
  const [deployer, user1, user2, user3, user4]: SignerWithAddress[] =
    await ethers.getSigners();
  const initialDeposit: BigNumber = ethers.utils.parseEther("5000");

  const usdtVault: USDT_Vault = await ethers.getContractAt(
    "USDT_Vault",
    vault.address
  );
  const usdtToken: USDT = await ethers.getContractAt("USDT", usdt.address);

  let allowance = await usdtToken.allowance(
    deployer.address,
    usdtVault.address
  );
  if (allowance.lt(initialDeposit)) {
    console.log("Minting USDT to all addresses");
    await usdtToken.connect(user1).mint();
    await usdtToken.connect(user2).mint();
    await usdtToken.connect(user3).mint();
    await usdtToken.connect(user4).mint();

    console.log("Approving USDT for vault from all addresses");
    await usdtToken.approve(usdtVault.address, ethers.constants.MaxUint256);
    await usdtToken
      .connect(user1)
      .approve(usdtVault.address, ethers.constants.MaxUint256);
    await usdtToken
      .connect(user2)
      .approve(usdtVault.address, ethers.constants.MaxUint256);
    await usdtToken
      .connect(user3)
      .approve(usdtVault.address, ethers.constants.MaxUint256);
    await usdtToken
      .connect(user4)
      .approve(usdtVault.address, ethers.constants.MaxUint256);
  }

  console.log("Setup complete");
}

setUp().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
