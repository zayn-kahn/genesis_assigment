// @ts-ignore
import { ethers } from "hardhat";
import { USDT__factory, USDT_Vault__factory } from "../types";

export async function deployFixture() {
  const USDTTokenFactory: USDT__factory = await ethers.getContractFactory(
    "USDT"
  );
  const VaultFactory: USDT_Vault__factory = await ethers.getContractFactory(
    "USDT_Vault"
  );

  return {
    USDTTokenFactory,
    VaultFactory,
  };
}
