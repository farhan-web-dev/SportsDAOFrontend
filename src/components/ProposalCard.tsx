"use client";

import { useEffect } from "react";
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { keccak256, toBytes, encodeAbiParameters, parseAbiParameters } from "viem";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { contracts } from "@/src/contracts";
import { useQueryClient } from "@tanstack/react-query";

interface ProposalCardProps {
  proposal: {
    _id?: string;
    proposalId?: string;
    title?: string;
    description: string;
    status?: string;
    target?: string;
    value?: string | number;
    calldata?: string;
    reportId?: {
      _id?: string;
      title?: string;
      description?: string;
      price?: string | number;
      [key: string]: any;
    };
    price?: string | number;
  };
  showActions?: boolean;
}

const PROPOSAL_STATES = [
  "Pending",
  "Active",
  "Canceled",
  "Defeated",
  "Succeeded",
  "Queued",
  "Expired",
  "Executed",
];

export default function ProposalCard({
  proposal,
  showActions = false,
}: ProposalCardProps) {
  const { address } = useAccount();

  // Get proposalId for on-chain state check
  // The on-chain proposalId should be a number, not a MongoDB ObjectId
  const proposalIdStr = proposal.proposalId || proposal._id;

  // Check if proposalId is a valid number (on-chain proposal ID)
  // MongoDB ObjectIds are 24 hex characters, so we check if it's numeric
  const isValidNumericId = proposalIdStr && /^\d+$/.test(String(proposalIdStr));
  const numericProposalId = isValidNumericId ? BigInt(proposalIdStr) : null;

  // Get governor address - ensure it's a valid address string
  const governorAddress =
    contracts.governor.address || process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS;

  // Check if we have all required data to make the contract call
  const isEnabled =
    numericProposalId !== null &&
    !!governorAddress &&
    typeof governorAddress === "string" &&
    governorAddress.startsWith("0x");

  // Read proposal state from on-chain (only if we have a valid numeric proposal ID and address)
  const {
    data: onChainState,
    isLoading: isLoadingState,
    error: contractError,
    refetch: refetchOnChainState,
  } = useReadContract({
    address: isEnabled ? (governorAddress as `0x${string}`) : undefined,
    abi: contracts.governor.abi,
    functionName: "state",
    args: numericProposalId !== null ? [numericProposalId] : undefined,
    query: {
      enabled: isEnabled,
    },
  });

  const queryClient = useQueryClient();

  console.log("onChainState", onChainState);

  // Debug logging
  useEffect(() => {
    console.log("🔍 ProposalCard Debug:", {
      proposalId: proposal.proposalId,
      proposalIdStr,
      isValidNumericId,
      numericProposalId: numericProposalId?.toString(),
      governorAddress,
      isEnabled,
      onChainState,
      isLoadingState,
      contractError: contractError
        ? {
            message: contractError.message,
            name: contractError.name,
          }
        : null,
      hasAbi: !!contracts.governor.abi,
    });
  }, [
    proposal.proposalId,
    proposalIdStr,
    isValidNumericId,
    numericProposalId,
    governorAddress,
    isEnabled,
    onChainState,
    isLoadingState,
    contractError,
  ]);

  // Use on-chain state if available, otherwise fall back to database status
  const stateNumber =
    onChainState !== undefined ? Number(onChainState) : undefined;
  const statusName =
    stateNumber !== undefined
      ? PROPOSAL_STATES[stateNumber] || "Unknown"
      : proposal.status || "PENDING";

  // Sync on-chain status back to backend
  useEffect(() => {
    if (stateNumber === undefined) return;
    if (!proposal.proposalId) return; // need an on-chain id to update by

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      console.warn(
        "NEXT_PUBLIC_BACKEND_URL is not set; cannot update proposal status"
      );
      return;
    }

    const payload = {
      proposalId: proposal.proposalId,
      status: statusName,
      // onChainState: stateNumber,
    };

    console.log("📡 Updating proposal status in backend:", payload);

    fetch(`${backendUrl}/api/v1/proposals/update-proposal-status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(address ? { "x-wallet-address": address } : {}),
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.ok) {
          console.log("✅ Successfully updated proposal status in backend");
        } else {
          console.error(
            "❌ Failed to update proposal status:",
            res.status,
            res.statusText
          );
        }
      })
      .catch((err) => {
        console.error("❌ Error updating proposal status in backend:", err);
      });
  }, [stateNumber, statusName, proposal.proposalId, address]);

  // Write contract hook
  const { writeContract, isPending: isWritePending, error: writeError, data: writeHash } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isWaitingTx, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: writeHash,
  });

  // Effect to handle post-execution logic
  useEffect(() => {
    if (isTxSuccess && writeHash) {
      console.log("🎉 Transaction confirmed:", writeHash);
      
      // Force an immediate refetch of on-chain state so the badge updates
      refetchOnChainState?.();

      // If we just executed (status was Queued -> Executed), update backend
      if (stateNumber === 5) { // 5 is Queued, so if we just ran a tx, likely it was Execute. 
         // Better check: verify which action was taken? 
         // For now, if we are in Queued state and tx succeeds, we assume it was Execute.
         // Or we can rely on re-fetching state.
         
         // Trigger backend update for "EXECUTED"
         updateBackendStatus("EXECUTED");
      } else if (stateNumber === 4) {
         // If we were Succeeded and tx succeeded, we likely Queued.
         // Backend might not track "QUEUED" specifically or maybe it does?
         // User said: "When execution completes: update Proposal.status = 'EXECUTED'"
         // So for Queue, maybe just re-fetch on chain state?
      }
    }
  }, [isTxSuccess, writeHash, stateNumber]);

  const updateBackendStatus = async (newStatus: string) => {
      if (!proposal.proposalId) return;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) return;

      try {
        const payload = {
            proposalId: proposal.proposalId,
            status: newStatus,
        };
        await fetch(`${backendUrl}/api/v1/proposals/update-proposal-status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...(address ? { "x-wallet-address": address } : {}),
            },
            body: JSON.stringify(payload),
        });
        console.log(`Backend updated to ${newStatus}`);
        
        // Invalidate queries so the lists reload automatically without refresh
        queryClient.invalidateQueries({ queryKey: ["proposals"] });
      } catch (err) {
        console.error("Failed to update backend", err);
      }
  };

  const handleQueue = () => {
    if (!numericProposalId || !isEnabled) return;
    
    try {
        const descriptionHash = keccak256(toBytes(proposal.description));
        const targets = [proposal.target as `0x${string}`]; // Assuming single target
        const values = [BigInt(proposal.value || 0)];
        const calldatas = [(proposal.calldata || "0x") as `0x${string}`];

        writeContract({
            address: governorAddress as `0x${string}`,
            abi: contracts.governor.abi,
            functionName: "queue",
            args: [targets, values, calldatas, descriptionHash],
        });
    } catch (e) {
        console.error("Error preparing queue tx:", e);
    }
  };

  const handleExecute = () => {
    if (!numericProposalId || !isEnabled) return;
    
    try {
        const descriptionHash = keccak256(toBytes(proposal.description));
        const targets = [proposal.target as `0x${string}`];
        const values = [BigInt(proposal.value || 0)];
        const calldatas = [(proposal.calldata || "0x") as `0x${string}`];

        writeContract({
            address: governorAddress as `0x${string}`,
            abi: contracts.governor.abi,
            functionName: "execute",
            args: [targets, values, calldatas, descriptionHash],
        });
    } catch (e) {
        console.error("Error preparing execute tx:", e);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            {proposal.title ||
              `Proposal #${proposal._id || proposal.proposalId}`}
          </CardTitle>

          {(stateNumber !== undefined || proposal.status) && (
            <Badge
              variant={
                stateNumber === 7 || proposal.status === "EXECUTED"
                  ? "default"
                  : "secondary"
              }
            >
              {isLoadingState ? "Loading..." : statusName}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {(proposal.price || proposal.reportId?.price) && (
          <div className="mb-2 font-semibold text-primary">
            Price: {proposal.price || proposal.reportId?.price} $FANSTOKEN
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-4">
          {proposal.description}
        </p>
        
        {writeError && (
             <p className="text-sm text-red-500 mt-2">Error: {writeError.message}</p>
        )}
      </CardContent>
      
      {showActions && isEnabled && (
          <CardFooter className="flex gap-2 justify-end">
              {stateNumber === 4 && ( // Succeeded
                  <Button 
                    onClick={handleQueue} 
                    disabled={isWritePending || isWaitingTx}
                  >
                    {isWritePending || isWaitingTx ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : "Queue Proposal"}
                  </Button>
              )}
              
              {stateNumber === 5 && ( // Queued
                  <Button 
                    onClick={handleExecute}
                    disabled={isWritePending || isWaitingTx}
                  >
                     {isWritePending || isWaitingTx ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Executing...
                        </>
                    ) : "Execute Proposal"}
                  </Button>
              )}
          </CardFooter>
      )}
    </Card>
  );
}
