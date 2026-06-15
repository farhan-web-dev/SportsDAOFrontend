"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useCheckAdmin } from "@/src/hooks/use-auth";
import { useEffect } from "react";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { address, isConnected, isConnecting, isReconnecting, status } =
    useAccount();
  const { data: adminData, isLoading } = useCheckAdmin(address);
  const isAuthorized = adminData?.isAdmin ?? false;

  // Debug connection status (remove in production)
  useEffect(() => {
    console.log("Connection status:", {
      isConnected,
      isConnecting,
      isReconnecting,
      status,
      address,
    });
  }, [isConnected, isConnecting, isReconnecting, status, address]);

  // Show connecting state
  if (isConnecting || isReconnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connecting...</h1>
          <p className="text-muted-foreground">
            Please approve the connection in your wallet
          </p>
        </div>
      </div>
    );
  }

  // Show not connected state
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold mb-4">Not Connected</h1>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to continue
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Verifying...</h1>
          <p className="text-muted-foreground">Checking admin permissions</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Authorized</h1>
          <p className="text-muted-foreground">
            You are not authorized to access this page
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
