import { truncateAddress } from "@/utils";
import React from "react";
import { IDappContext, useDapp } from "@/Context/DappContext";

function History() {
  const { depositHistory } = useDapp() as IDappContext;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: "10px",
      }}
    >
      <div>
        <h2>HISTORY</h2>
        <table>
          <thead>
            <tr>
              <th style={{ padding: "5px 30px" }}>#</th>
              <th style={{ padding: "5px 30px" }}>type</th>
              <th style={{ padding: "5px 30px" }}>Amount</th>
              <th style={{ padding: "5px 30px" }}>Transaction Hash</th>
              <th style={{ padding: "5px 30px" }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {depositHistory &&
              depositHistory.map((transaction, index) => (
                <tr key={transaction.transactionHash}>
                  <td>{index + 1}</td>
                  <td>{transaction.type}</td>
                  <td>{transaction.amount}</td>
                  <td
                    style={{ cursor: "pointer" }}
                    onClick={() => window.open("https://etherscan.io/")}
                  >
                    {truncateAddress(transaction.transactionHash)}
                  </td>
                  <td>
                    {new Date(transaction.timestamp * 1_000).toLocaleString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default History;
