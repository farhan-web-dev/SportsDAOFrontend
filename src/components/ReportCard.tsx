"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { usePrepareProposalData } from "@/src/hooks/use-reports";
import { useUpdateProposalId } from "@/src/hooks/use-proposals";
import { contracts } from "@/src/contracts";

import { parseEther, keccak256, stringToBytes } from "viem";
import type { Report } from "@/src/apis/reports";

interface ReportCardProps {
  report: Report;
  showActions?: boolean;
}

export default function ReportCard({
  report,
  showActions = false,
}: ReportCardProps) {
  const { address } = useAccount();
  const [error, setError] = useState("");
  const [dbg, setDbg] = useState<any>({});
  const [proposalDbId, setProposalDbId] = useState<string | number | null>(
    null
  );
  const [proposalData, setProposalData] = useState<{
    target: string;
    value: string | number;
    data: string;
    description: string;
  } | null>(null);

  const { mutate: prepareProposal, isPending: isPreparingProposal } =
    usePrepareProposalData();
  const { mutate: updateProposalId, isPending: isUpdatingProposalId } =
    useUpdateProposalId();

  const {
    writeContract,
    data: txHash,
    isPending: isPendingTx,
    error: txError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Compute description hash only when proposalData exists
  const descriptionHash = proposalData
    ? keccak256(stringToBytes(proposalData.description))
    : undefined;

  const { data: onChainProposalId, error: readError } = useReadContract({
    address: contracts.governor.address as `0x${string}` | undefined,
    abi: contracts.governor.abi,
    functionName: "getProposalId",
    args:
      proposalData && descriptionHash
        ? [
            [proposalData.target as `0x${string}`],
            [BigInt(proposalData.value || 0)],
            [proposalData.data as `0x${string}`],
            descriptionHash,
          ]
        : undefined,
    query: {
      enabled: !!isConfirmed && !!proposalData && !!contracts.governor.address,
    },
  });

  // Debug logging helper
  const debug = (key: string, value: any) => {
    console.log("DEBUG:", key, value);
    setDbg((prev: any) => ({ ...prev, [key]: value }));
  };

  // Update backend when on-chain proposalId is found
  useEffect(() => {
    if (!onChainProposalId || !proposalDbId || !address) return;

    debug("onChainProposalId", onChainProposalId);

    updateProposalId(
      {
        payload: {
          proposalDbId,
          proposalId: String(onChainProposalId),
        },
        walletAddress: address,
      },
      {
        onSuccess: () => debug("backendUpdate", "SUCCESS"),
        onError: (err) => {
          debug("backendUpdateError", err);
          setError(
            err instanceof Error ? err.message : "Failed to update proposal ID"
          );
        },
      }
    );
  }, [onChainProposalId, proposalDbId, address, updateProposalId]);

  const handleCreateProposal = () => {
    if (!address) return setError("Wallet not connected");

    const reportId = String(report._id || (report as any).id || "").trim();
    if (!reportId) return setError("Invalid report ID");

    setError("");

    debug("createProposal_clicked", {
      reportId,
      governorAddress: contracts.governor.address,
      abiLoaded: !!contracts.governor.abi,
    });

    if (!contracts.governor.address) {
      debug("error", "Governor address missing");
      return setError("Governor contract address not configured");
    }

    // Step 1: Prepare proposal data
    prepareProposal(
      {
        payload: { reportId },
        walletAddress: address,
      },
      {
        onSuccess: (res) => {
          debug("prepareProposal_response", res);

          setProposalDbId(res.proposalDbId);
          setProposalData({
            target: res.target,
            value: res.value,
            data: res.data,
            description: res.description,
          });

          // Prepare value
          const bigintValue =
            typeof res.value === "string" && res.value.includes(".")
              ? parseEther(res.value)
              : BigInt(res.value || 0);

          debug("propose_call_args", {
            target: res.target,
            value: bigintValue,
            data: res.data,
            description: res.description,
          });

          // On-chain propose() call
          writeContract({
            address: contracts.governor.address as `0x${string}`,
            abi: contracts.governor.abi,
            functionName: "propose",
            args: [
              [res.target as `0x${string}`],
              [bigintValue],
              [res.data as `0x${string}`],
              res.description,
            ],
          });
        },
        onError: (err) => {
          debug("prepareProposal_error", err);
          setError(
            err instanceof Error ? err.message : "Failed to prepare proposal"
          );
        },
      }
    );
  };

  const isPending =
    isPreparingProposal || isPendingTx || isConfirming || isUpdatingProposalId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            {report.title || `Report #${report._id}`}
          </CardTitle>
          <Badge variant="secondary">Pending</Badge>
        </div>
      </CardHeader>

      <CardContent>
        {report.price && (
          <div className="mb-2 font-semibold text-primary">
            Price: {report.price} $FANSTOKEN
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-4">
          {report.description}
        </p>

        {report.ipfsLink && (
          <a
            href={report.ipfsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline block mb-4"
          >
            View on IPFS
          </a>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {txError && <p className="text-sm text-red-600">{txError.message}</p>}
        {readError && (
          <p className="text-sm text-red-600">
            Read Error: {readError.message}
          </p>
        )}

        {isConfirmed && (
          <p className="text-sm text-green-600 mb-2">
            Proposal created and submitted on-chain!
          </p>
        )}

        {showActions && (
          <Button
            onClick={handleCreateProposal}
            disabled={isPending}
            variant="default"
            size="sm"
            className="w-full"
          >
            {isPending
              ? isPreparingProposal
                ? "Preparing..."
                : isConfirming
                ? "Confirming..."
                : "Submitting..."
              : "Create Proposal"}
          </Button>
        )}

        {/* Debug Panel */}
        {/* <pre className="mt-4 p-2 text-xs bg-black text-green-400 rounded max-h-64 overflow-auto">
          {JSON.stringify(
            dbg,
            (key, value) =>
              typeof value === "bigint" ? value.toString() : value,
            2
          )}
        </pre> */}
      </CardContent>
    </Card>
  );
}
