"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";

import { getConfig } from "@/wagmi";
import { DappProvider } from "@/Context/DappContext";
import { ToastContainer } from "react-toastify";

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config} initialState={props.initialState}>
      <QueryClientProvider client={queryClient}>
        <DappProvider>{props.children}</DappProvider>
        <ToastContainer autoClose={3000} theme="dark" />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
