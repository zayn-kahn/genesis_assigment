import { useDapp } from "@/Context/DappContext";
import { IDappContext } from "@/Context/DappContext";
import { usdtConfig } from "@/contract";
import { logError } from "@/utils";
import React, { useEffect } from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { BaseError } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";
import { useWriteContract } from "wagmi";

function Mint() {
  const { data, isPending, writeContractAsync } = useWriteContract();
  const { fetchUsdtBalance, fetchBalance, updateLogs } = useDapp() as IDappContext;

  const { isSuccess, isLoading } = useWaitForTransactionReceipt({
    hash: data,
    confirmations: 3,
  });

  const handleMint = async () => {
    try {
      await writeContractAsync({
        address: usdtConfig.address,
        abi: usdtConfig.abi,
        functionName: "mint",
      });
      
    } catch (e) {
      const error = e as BaseError;
      logError(error, "Mint Failed");
    }
  };

  useEffect(() => {
    if (isSuccess) {
      updateLogs();
      fetchBalance();
      fetchUsdtBalance();
      toast.success("1000 USDT minted");
    }
  }, [isSuccess]);

  return (
    <div
      className="flex flex-col items-center"
      style={{ marginBottom: "20px" }}
    >
      <Button variant="primary" style={{ width: "150px", marginLeft: "10px" }}>
        <span onClick={handleMint}>
          {!isPending && !isLoading && `Mint USDT`}
          {isPending && !isLoading && `Minting USDT...`}
          {!isPending && isLoading && `Waiting for tx...`}
        </span>
      </Button>
    </div>
  );
}

export default Mint;
