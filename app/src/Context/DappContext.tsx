import { usdtConfig, vaultConfig } from "@/contract";
import { BaseError } from "viem";
import { logError } from "@/utils";
import { Contract, getDefaultProvider } from "ethers";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { hardhat } from "viem/chains";
import { useAccount, useReadContract, useWatchContractEvent } from "wagmi";
import { useBalance } from "wagmi";
import { toast } from "react-toastify";

export const DappContext = createContext({});

export interface IDepositHistory {
  amount: string;
  timestamp: number;
  transactionHash: string;
  type: "Withdraw" | "Deposit" | "Claim";
}

export interface IDappContext {
  depositHistory: IDepositHistory[];
  balance: bigint;
  usdtBalance: bigint;
  userDeposit: {
    amount: bigint;
    yieldingStartedAt: bigint;
  };
  userReward: bigint;
  rewardPool: {
    generatedYield: bigint;
    claimedReward: bigint;
  };
  updateLogs: () => void;
  fetchBalance: () => void;
  fetchUsdtBalance: () => void;
  fetchUserDeposit: () => void;
  fetchUserReward: () => void;
  fetchRewardPool: () => void;
}

export const DappProvider = ({ children }: { children: React.ReactNode }) => {
  const [depositHistory, setDepositHistory] = useState<IDepositHistory[]>([]);
  const { address, isConnected } = useAccount();
  const {
    isFetched: isBalanceFetched,
    data: balance,
    refetch: fetchBalance,
  } = useBalance({
    address: address,
  });

  const {
    data: usdtBalance,
    isFetched: isUsdtBalanceFetched,
    refetch: fetchUsdtBalance,
  } = useReadContract({
    address: usdtConfig.address,
    abi: usdtConfig.abi,
    functionName: "balanceOf",
    // @ts-ignore
    args: [address],
    enabled: isConnected,
  });

  const {
    data: userDeposit,
    isFetched: isUserDepositFetched,
    refetch: fetchUserDeposit,
  } = useReadContract({
    address: vaultConfig.address,
    abi: vaultConfig.abi,
    functionName: "getUserDeposit",
    // @ts-ignore
    args: [address],
    enabled: isConnected,
  });

  const {
    data: rewardPool,
    isFetched: isRewardPoolFetched,
    refetch: fetchRewardPool,
  } = useReadContract({
    address: vaultConfig.address,
    abi: vaultConfig.abi,
    functionName: "getRewardPool",
    // @ts-ignore
    enabled: isConnected,
  });

  const {
    data: userReward,
    isFetched: isUserRewardFetched,
    refetch: fetchUserReward,
  } = useReadContract({
    address: vaultConfig.address,
    abi: vaultConfig.abi,
    functionName: "getUserReward",
    // @ts-ignore
    args: [address, 1],
    enabled: isConnected,
  });

  useWatchContractEvent({
    address: vaultConfig.address,
    abi: vaultConfig.abi,
    eventName: "Vault_DepositYieldGenerated",
    onLogs() {
      updateLogs();
      fetchUserReward().then(() => {
        console.log("New Deposited Yield Generated");
      });
    },
  });

  const updateLogs = async () => {
    try {
      if (!address) return;
      const provider = getDefaultProvider(hardhat.rpcUrls.default.http[0]);
      const contract = new Contract(
        vaultConfig.address,
        vaultConfig.abi,
        provider
      );
      const depositFilter = contract.filters.Vault_Deposit(address);
      const withdrawFilter = contract.filters.Vault_Withdrawal(address);
      const claimFilter = contract.filters.Vault_ClaimReward(address);

      const depositEvents = await contract.queryFilter(
        depositFilter,
        0,
        "latest"
      );
      const claimEvents = await contract.queryFilter(claimFilter, 0, "latest");
      const withdrawEvents = await contract.queryFilter(
        withdrawFilter,
        0,
        "latest"
      );

      const userLogs = withdrawEvents
        .map((e) => {
          return {
            amount: `- ${formatUnits(e.decode?.(e.data)?.amount || 0, 6)}`,
            timestamp: Number(formatUnits(e.decode?.(e.data)?.timestamp, 0)) || 0,
            transactionHash: e.transactionHash,
            type: "Withdraw",
          };
        })
        .concat(
          depositEvents.map((e) => {
            return {
              amount: `+ ${formatUnits(e.decode?.(e.data)?.amount || 0, 6)}`,
              timestamp: Number(formatUnits(e.decode?.(e.data)?.timestamp, 0)) || 0,
              transactionHash: e.transactionHash,
              type: "Deposit",
            };
          })
        )
        .concat(
          claimEvents.map((e) => {
            return {
              amount: `+ ${formatUnits(e.decode?.(e.data)?.amount || 0, 6)}`,
              timestamp: Number(formatUnits(e.decode?.(e.data)?.timestamp, 0)) || 0,
              transactionHash: e.transactionHash,
              type: "Claim",
            };
          })
        )
        .sort((a, b) => b.timestamp - a.timestamp);
      setDepositHistory(userLogs as IDepositHistory[]);
    } catch (e) {
      setDepositHistory([]);
      const error = e as BaseError;
      logError(error, "Get Logs Failed");
    }
  };

  useEffect(() => {
    if (isConnected) {
      updateLogs();
      fetchBalance();
      fetchUsdtBalance();
      fetchUserDeposit();
      fetchUserReward();
      fetchRewardPool();
    }
  }, [address]);

  const value = useMemo(() => {
    if (
      isBalanceFetched &&
      isUsdtBalanceFetched &&
      isUserDepositFetched &&
      isUserRewardFetched &&
      isRewardPoolFetched
    ) {
      return {
        depositHistory,
        balance: balance?.value,
        usdtBalance,
        userDeposit,
        userReward,
        rewardPool: {
          generatedYield: rewardPool?.[0],
          claimedReward: rewardPool?.[1],
        },
        updateLogs,
        fetchBalance,
        fetchUsdtBalance,
        fetchUserDeposit,
        fetchUserReward,
        fetchRewardPool,
      };
    }
    return {};
  }, [
    isBalanceFetched,
    isUsdtBalanceFetched,
    isUserDepositFetched,
    isUserRewardFetched,
    isRewardPoolFetched,
    depositHistory.length,
  ]);

  return <DappContext.Provider value={value}>{children}</DappContext.Provider>;
};

export const useDapp = () => {
  const context = useContext(DappContext);
  return context;
};
