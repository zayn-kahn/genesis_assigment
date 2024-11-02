import { usdt, vault } from "../addresses/31337.json";
import { USDT__factory, USDT_Vault__factory } from "@/types";

export const usdtConfig = {
    address: usdt.address as `0x${string}`,
    abi: USDT__factory.abi,
}

export const vaultConfig = {
    address: vault.address as `0x${string}`,
    abi: USDT_Vault__factory.abi,
}