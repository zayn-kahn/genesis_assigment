import { vaultConfig } from "@/contract";
import { logError } from "@/utils";
import React, { useEffect } from "react";
import { Button } from "react-bootstrap";
import { BaseError } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";
import { useWriteContract } from "wagmi";
import { IDappContext, useDapp } from "@/Context/DappContext";
import { toast } from "react-toastify";

function Reward() {
  const { data, isPending, writeContractAsync } = useWriteContract();
  const { fetchUsdtBalance, fetchUserDeposit, fetchUserReward, updateLogs, fetchRewardPool } = useDapp() as IDappContext;

  const { isSuccess, isLoading } = useWaitForTransactionReceipt({
    hash: data,
    confirmations: 3,
  });

  const handleReward = async () => {
    try {
      await writeContractAsync({
        address: vaultConfig.address,
        abi: vaultConfig.abi,
        functionName: "claimReward",
      });
      toast.info("Reward Claim Tx sent");
    } catch (e) {
      const error = e as BaseError;
      logError(error, "Claim Reward Failed");
    }
  };

  useEffect(() => {
    if (isSuccess) {
      updateLogs();
      fetchUserReward();
      fetchUserDeposit();
      fetchUsdtBalance();
      fetchRewardPool();
      toast.success("Reward claimed");
    };
  }, [isSuccess]);

  return (
    <div
      className="flex flex-col items-center"
      style={{ marginBottom: "20px" }}
    >
      <Button variant="success" style={{ width: "200px", marginLeft: "10px" }}>
        <span onClick={handleReward}>
          {!isPending && !isLoading && `Claim Reward`}
          {isPending && !isLoading && `Claiming Reward...`}
          {!isPending && isLoading && `Waiting for tx...`}
        </span>
      </Button>
    </div>
  );
}

export default Reward;
