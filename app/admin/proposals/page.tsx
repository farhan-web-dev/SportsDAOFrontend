"use client";

import { useAccount } from "wagmi";
import ProposalCard from "@/src/components/ProposalCard";
import { useProposals } from "@/src/hooks/use-proposals";

export default function ProposalsPage() {
  const { address } = useAccount();
  const {
    data: proposals = [],
    isLoading: loading,
    error,
  } = useProposals(address);

  console.log(proposals);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
        <p className="text-muted-foreground">
          View and manage active proposals
        </p>
      </div>

      {loading && <p>Loading proposals...</p>}
      {error && (
        <p className="text-red-600">
          {error instanceof Error ? error.message : "Failed to fetch proposals"}
        </p>
      )}

      <div className="space-y-4">
        {proposals.length === 0 && !loading && (
          <p className="text-muted-foreground">No proposals found</p>
        )}
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.proposalId || proposal._id}
            proposal={proposal}
            showActions
          />
        ))}
      </div>
    </div>
  );
}
