// @ts-ignore
import { ethers, run } from "hardhat";
import { USDT_Vault__factory, USDT__factory } from "../types";
import { writeFile, cp } from "fs";
import path from "path";

import { FormatTypes } from "ethers/lib/utils";

function spaces() {
  console.log("--------------------");
}

async function main() {
  console.log("Deploying USDT and Vault Contracts");
  const deployer = (await ethers.getSigners())[0];
  console.log("Deployer Address:", deployer.address);

  const USDTVaultFactory: USDT_Vault__factory = await ethers.getContractFactory(
    "USDT_Vault"
  );

  const USDTFactory: USDT__factory = await ethers.getContractFactory("USDT");

  const usdt = await USDTFactory.deploy(deployer.address);
  await usdt.deployed();
  spaces();
  console.log("USDT deployed to:", usdt.address);

  const vault = await USDTVaultFactory.deploy(usdt.address);
  await vault.deployed();
  spaces();
  console.log("USDT Vault deployed to:", vault.address);
  spaces();

  console.log("All contracts deployed successfully!");
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 31337) {
    await run("verify:verify", {
      address: usdt.address,
      constructorArguments: [deployer.address],
    });
    await run("verify:verify", {
      address: vault.address,
      constructorArguments: [usdt.address],
    });
  }
  const deployedAddress = JSON.stringify({
    usdt: {
      address: usdt.address,
    },
    vault: {
      address: vault.address,
    },
  });
  copy(deployedAddress, network);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

function copy(deployedAddress: string, network: any) {
  cp(
    "./types",
    path.join(__dirname, "..", "..", "app", "src", "types"),
    { recursive: true },
    (err) => {
      if (err) {
        console.error("Error copying types:", err);
      } else {
        console.log("Typechain-types copied to app/src/types");
      }
    }
  );
  writeFile(
    `./scripts/addresses/${network.chainId}.json`,
    deployedAddress,
    (err) => {
      if (err) {
        console.error("Error writing file:", err);
      } else {
        console.log(
          `Addresses save in contracts/address/${network.chainId} for chainId ${network.chainId}`
        );
        cp(
          `./scripts/addresses/${network.chainId}.json`,
          path.join(
            __dirname,
            "..",
            "..",
            "app",
            "src",
            "addresses",
            `${network.chainId}.json`
          ),
          { recursive: true },
          (err) => {
            if (err) {
              console.error("Error copying types:", err);
            } else {
              console.log("Address copied to app/src/address");
            }
          }
        );
      }
    }
  );
}
