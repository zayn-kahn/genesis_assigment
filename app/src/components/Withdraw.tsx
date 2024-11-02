import { IDappContext, useDapp } from "@/Context/DappContext";
import { vaultConfig } from "@/contract";
import { logError } from "@/utils";
import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { BaseError, parseUnits } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

function Withdraw() {
  const { fetchUsdtBalance, updateLogs, fetchUserDeposit, fetchUserReward } = useDapp() as IDappContext;
  const [withdrawAmount, setWithdrawAmount] = useState(1);
  const { data, isPending, writeContractAsync } = useWriteContract();

  const { isSuccess, isLoading } = useWaitForTransactionReceipt({
    hash: data,
    confirmations: 3,
  });

  const handleWithdraw = async () => {
    console.log({ withdrawAmount });
    if (withdrawAmount <= 0) {
      toast.warn("Withdraw amount must be greater than 0");
      return;
    }
    try {
      await writeContractAsync({
        address: vaultConfig.address,
        abi: vaultConfig.abi,
        functionName: "withdraw",
        args: [parseUnits(String(withdrawAmount), 6)],
      });
      toast.info(`Withdraw Tx for ${withdrawAmount} USDT sent`);
    } catch (e) {
      const error = e as BaseError;
      logError(error, "Withdraw Failed");
    }
  };

  useEffect(() => {
    if (isSuccess) {
      updateLogs();
      fetchUsdtBalance();
      fetchUserDeposit();
      fetchUserReward();
      toast.success(`${withdrawAmount} USDT Withdrawn`);
    }
  }, [isSuccess]);

  return (
    <div
      className="flex flex-col items-center"
      style={{ marginBottom: "20px" }}
    >
      <input
        type="number"
        value={withdrawAmount}
        onChange={(e) => {
          if (Number(e.target.value) >= 0) {
            setWithdrawAmount(Number(e.target.value));
          }
        }}
        className="border border-gray-300 p-2 rounded"
        placeholder="Enter deposit amount"
      />
      <Button
        onClick={handleWithdraw}
        variant="danger"
        style={{ width: "150px", marginLeft: "10px" }}
      >
        {!isPending && !isLoading && `Withdraw`}
        {isPending && !isLoading && `Withdrawing...`}
        {!isPending && isLoading && `Waiting for tx...`}
      </Button>
    </div>
  );
}

export default Withdraw;
