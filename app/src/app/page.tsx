"use client";
import { IDappContext, useDapp } from "@/Context/DappContext";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { formatAmount, truncateAddress } from "@/utils";
import { Button } from "react-bootstrap";
import Deposit from "@/components/Deposit";
import History from "@/components/History";
import Mint from "@/components/Mint";
import Reward from "@/components/Reward";
import Withdraw from "@/components/Withdraw";

function App() {
  const { balance, usdtBalance, userDeposit, userReward, rewardPool } =
    useDapp() as IDappContext;
  const { address, isConnected } = useAccount();
  const { connectors, connect, error } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "black",
        }}
      >
        <div style={{ color: "white", textAlign: "center" }}>
          <p>Address: {address && truncateAddress(address)}</p>
          <p>ETH Balance: {formatAmount(balance, 18)}</p>
          <p>USDT Balance: {formatAmount(usdtBalance, 6)}</p>
          <p>Deposited Amount: {formatAmount(userDeposit?.amount, 6)}</p>
          <p>Reward: {formatAmount(userReward, 6)}</p>
          <p>Reward Pool: {formatAmount(rewardPool?.generatedYield, 6)}</p>
          <p>Claimed Reward: {formatAmount(rewardPool?.claimedReward, 6)}</p>
          {!isConnected && (
            <>
              {connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  variant="light"
                  onClick={() => connect({ connector })}
                  type="button"
                  style={{ margin: "10px" }}
                >
                  {connector.name}
                </Button>
              ))}
              {error?.message && <p>{error.message}</p>}
            </>
          )}
          {isConnected && (
            <>
              <Mint />
              <Deposit />
              <Withdraw />
              <Reward />
              <History />
              <Button
                variant="danger"
                type="button"
                onClick={() => disconnect()}
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
