// @ts-ignore
import { ethers } from "hardhat";
import { USDT, USDT_Vault } from "../types";
import { vault, usdt } from "./addresses/31337.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";

async function setUp() {
  const [deployer, user1, user2, user3, user4]: SignerWithAddress[] =
    await ethers.getSigners();
  const yieldGenerated: BigNumber = ethers.utils.parseUnits("100", "6");
  const depositAmount: BigNumber = ethers.utils.parseUnits("10", "6");

  const usdtVault: USDT_Vault = await ethers.getContractAt(
    "USDT_Vault",
    vault.address
  );

  const usdtToken: USDT = await ethers.getContractAt("USDT", usdt.address);

  let allowance = await usdtToken.allowance(user1.address, usdtVault.address);
  
  if (allowance.lt(yieldGenerated)) {
    await usdtToken.connect(user1).mint();
    await usdtToken.connect(user2).mint();
    await usdtToken.connect(user3).mint();
    await usdtToken.connect(user4).mint();
    console.log("Approving USDT for all addresses for vault");
    await usdtToken
      .connect(deployer)
      .approve(usdtVault.address, ethers.constants.MaxUint256);

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
    console.log(
      `Depositing ${formatUnits(
        depositAmount,
        6
      )} USDT to vault from all addresses`
    );
    await usdtVault.connect(user1).deposit(depositAmount);
    await usdtVault.connect(user2).deposit(depositAmount);
    await usdtVault.connect(user3).deposit(depositAmount);
    await usdtVault.connect(user4).deposit(depositAmount);
  }

  console.log("Depositing yield to vault");
  await usdtVault.connect(deployer).depositYieldGenerated(yieldGenerated);

  console.log("Setup complete");
}

setUp().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
