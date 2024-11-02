import { IDappContext, useDapp } from "@/Context/DappContext";
import { usdtConfig, vaultConfig } from "@/contract";
import { logError } from "@/utils";
import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { BaseError, formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { useWaitForTransactionReceipt } from "wagmi";
import { useWriteContract } from "wagmi";

function ApproveTokens({
  depositAmount,
  refetchAllowance,
}: {
  depositAmount: Number;
  refetchAllowance: Function;
}) {
  const { data, isPending, writeContractAsync } = useWriteContract();
  const { isSuccess, isLoading } = useWaitForTransactionReceipt({
    hash: data,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success(`${depositAmount} Tokens Approved`);
    }
  }, [isSuccess]);

  const handleApprove = async () => {
    try {
      await writeContractAsync({
        address: usdtConfig.address,
        abi: usdtConfig.abi,
        functionName: "approve",
        args: [vaultConfig.address, parseUnits(String(depositAmount), 6)],
      });
      refetchAllowance();
    } catch (e) {
      const error = e as BaseError;
      logError(error, "Approve Failed");
    }
  };

  return (
    <span onClick={() => handleApprove()}>
      {!isPending && !isLoading && `Approve`}
      {isPending && !isLoading && `Approving...`}
      {!isPending && isLoading && `Waiting for tx...`}
    </span>
  );
}

function Deposit() {
  const { fetchUsdtBalance, updateLogs, fetchUserDeposit, fetchUserReward } = useDapp() as IDappContext;
  const { isConnected, address } = useAccount();
  const [depositAmount, setDepositAmount] = useState(1);
  const { data, isPending, writeContractAsync } = useWriteContract();

  const { isSuccess, isLoading } = useWaitForTransactionReceipt({
    hash: data,
    confirmations: 3,
  });

  const {
    data: allowance,
    isFetched: isAllowanceFetched,
    refetch: refetchAllowance,
  } = useReadContract({
    address: usdtConfig.address,
    abi: usdtConfig.abi,
    functionName: "allowance",
    // @ts-ignore
    args: [address, vaultConfig.address],
    enabled: isConnected,
  });

  const handleDeposit = async () => {
    console.log({ depositAmount });
    // console.log({ allowance });
    if (depositAmount <= 0) {
      toast.warn("Deposit amount must be greater than 0");
      return;
    }
    try {
      if (depositAmount > Number(formatUnits(allowance as bigint, 6))) {
        await writeContractAsync({
          address: usdtConfig.address,
          abi: usdtConfig.abi,
          functionName: "approve",
          args: [vaultConfig.address, parseUnits(String(depositAmount), 6)],
        });
      }
      await writeContractAsync({
        address: vaultConfig.address,
        abi: vaultConfig.abi,
        functionName: "deposit",
        args: [parseUnits(String(depositAmount), 6)],
      });
      toast.info(`Deposit Tx for ${depositAmount} USDT sent`);
    } catch (e) {
      const error = e as BaseError;
      logError(error, "Deposit Failed");
    }
  };

  useEffect(() => {
    if (!isAllowanceFetched) refetchAllowance();
    if (isSuccess) {
      updateLogs();
      fetchUsdtBalance();
      fetchUserDeposit();
      fetchUserReward();
      toast.success(`${depositAmount} USDT Deposited`);
    }
  }, [address, isAllowanceFetched, isSuccess]);

  return (
    <div
      className="flex flex-col items-center"
      style={{ marginBottom: "20px" }}
    >
      <input
        type="number"
        value={depositAmount}
        onChange={(e) => {
          if (Number(e.target.value) >= 0) {
            setDepositAmount(Number(e.target.value));
          }
        }}
        className="border border-gray-300 p-2 rounded"
        placeholder="Enter deposit amount"
      />
      <Button
        variant={
          isAllowanceFetched && depositAmount > Number(formatUnits(allowance as bigint, 6))
            ? "primary"
            : "success"
        }
        style={{ width: "150px", marginLeft: "10px" }}
      >
        {isAllowanceFetched &&
          depositAmount > Number(formatUnits(allowance as bigint, 6)) ? (
            <ApproveTokens
              depositAmount={depositAmount}
              refetchAllowance={refetchAllowance}
          />
        ) : (
          <span onClick={handleDeposit}>
            {!isPending && !isLoading && `Deposit`}
            {isPending && !isLoading && `Depositing...`}
            {!isPending && isLoading && `Waiting for tx...`}
          </span>
        )}
      </Button>
    </div>
  );
}

export default Deposit;
