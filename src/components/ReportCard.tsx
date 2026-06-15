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
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Brain,
  Loader2,
  TrendingUp,
  User,
} from "lucide-react";

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

  const renderAIResults = () => {
    if (!report.aiResults) return null;

    const { status, error, claimsFound, verdicts } = report.aiResults;

    if (status === "pending") {
      return (
        <div className="mt-4 p-4 border border-violet-100 dark:border-violet-900 bg-violet-50/20 dark:bg-violet-950/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-400 rounded-full blur animate-ping opacity-25"></div>
              <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400 animate-pulse relative" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-violet-900 dark:text-violet-200 flex items-center gap-1.5">
                AI Fact-Checking Analysis <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
              </p>
              <p className="text-[11px] text-violet-600/80 dark:text-violet-400/80">
                Extracting statistical claims, resolving player identities, and validating records...
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (status === "failed") {
      return (
        <div className="mt-4 p-4 border border-red-100 dark:border-red-950 bg-red-50/20 dark:bg-red-950/10 rounded-xl">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-950 dark:text-red-200">
                AI Validation Failed
              </p>
              <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-0.5">
                {error || "The fact-checking service was unreachable or encountered an error."}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (status === "success") {
      if (!verdicts || verdicts.length === 0) {
        return (
          <div className="mt-4 p-4 border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                  AI Fact-Checking Complete
                </p>
                <p className="text-[11px] text-slate-500/80 dark:text-slate-400/80 mt-0.5">
                  No cricket statistical assertions or player profiles were recognized in the PDF.
                </p>
              </div>
            </div>
          </div>
        );
      }

      const trueCount = verdicts.filter(v => v.verdict === "TRUE").length;
      const falseCount = verdicts.filter(v => v.verdict === "FALSE").length;
      const approxCount = verdicts.filter(v => v.verdict === "APPROXIMATE").length;
      const infoCount = verdicts.length - (trueCount + falseCount + approxCount);

      return (
        <div className="mt-4 p-4 border border-violet-100 dark:border-violet-900/50 bg-violet-50/5 dark:bg-violet-950/5 rounded-2xl space-y-3 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-violet-100/50 dark:border-violet-900/20">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-violet-800 dark:text-violet-300">
                AI Fact-Checking Verdicts
              </h3>
            </div>
            <div className="flex flex-wrap gap-1">
              {trueCount > 0 && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 text-[9px] px-1.5 py-0">
                  {trueCount} True
                </Badge>
              )}
              {falseCount > 0 && (
                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 text-[9px] px-1.5 py-0">
                  {falseCount} False
                </Badge>
              )}
              {approxCount > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 text-[9px] px-1.5 py-0">
                  {approxCount} Approx
                </Badge>
              )}
              {infoCount > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30 text-[9px] px-1.5 py-0">
                  {infoCount} Info
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {verdicts.map((v, idx) => {
              let verdictColor = "border-slate-100 bg-slate-50/30 text-slate-700 dark:border-slate-800 dark:bg-slate-900/20 dark:text-slate-300";
              let verdictBadge = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
              let Icon = Info;

              if (v.verdict === "TRUE") {
                verdictColor = "border-emerald-100 bg-emerald-50/10 dark:border-emerald-950/30 dark:bg-emerald-950/5";
                verdictBadge = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400";
                Icon = CheckCircle2;
              } else if (v.verdict === "FALSE") {
                verdictColor = "border-rose-100 bg-rose-50/10 dark:border-rose-950/30 dark:bg-rose-950/5";
                verdictBadge = "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400";
                Icon = XCircle;
              } else if (v.verdict === "APPROXIMATE") {
                verdictColor = "border-amber-100 bg-amber-50/10 dark:border-amber-950/30 dark:bg-amber-950/5";
                verdictBadge = "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400";
                Icon = AlertTriangle;
              }

              return (
                <div key={idx} className={`p-3 border rounded-xl space-y-2 transition-all hover:shadow-sm ${verdictColor}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] text-muted-foreground font-mono">
                      Claim #{idx + 1}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0 rounded-full ${verdictBadge}`}>
                      {v.verdict}
                    </span>
                  </div>

                  <p className="text-[11px] font-medium leading-relaxed italic text-foreground dark:text-slate-200">
                    "{v.claim}"
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-violet-100/50 dark:border-slate-800/50 text-[10px]">
                    {v.subject && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-2.5 w-2.5 text-violet-500" />
                        <span className="truncate">Player: <strong className="text-foreground dark:text-slate-300 font-semibold">{v.subject}</strong></span>
                      </div>
                    )}
                    
                    {v.accuracy_pct !== undefined && v.accuracy_pct !== null && (
                      <div className="flex items-center gap-1 text-muted-foreground justify-end">
                        <TrendingUp className="h-2.5 w-2.5 text-violet-500" />
                        <span>Accuracy: <strong className="text-foreground dark:text-slate-300 font-semibold">{v.accuracy_pct}%</strong></span>
                      </div>
                    )}

                    {v.claimed_value !== undefined && v.claimed_value !== null && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400/50"></span>
                        <span>Claimed: <strong className="text-foreground dark:text-slate-300 font-semibold">{v.claimed_value}</strong></span>
                      </div>
                    )}

                    {v.real_val !== undefined && v.real_val !== null && (
                      <div className="flex items-center gap-1 text-muted-foreground justify-end">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50"></span>
                        <span>Actual: <strong className="text-foreground dark:text-slate-300 font-semibold">{v.real_val}</strong></span>
                      </div>
                    )}
                  </div>

                  {v.sample_size !== undefined && v.sample_size > 0 && (
                    <p className="text-[9px] text-muted-foreground/80 mt-1">
                      * Verified against {v.sample_size} matches/deliveries in clean ODI/Test dataset.
                    </p>
                  )}

                  {v.message && (
                    <div className="p-1.5 mt-1.5 bg-slate-100/50 dark:bg-slate-900/40 rounded-lg text-[9px] text-muted-foreground flex gap-1 items-start">
                      <Icon className="h-3 w-3 mt-0.5 shrink-0 text-violet-500" />
                      <span className="leading-normal">{v.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
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

        {/* AI Fact-Checking Results */}
        {renderAIResults()}

        <div className="mt-4">
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
        </div>

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
