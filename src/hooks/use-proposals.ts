import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllProposals,
  getProposalById,
  createProposal,
  voteOnProposal,
  queueProposal,
  executeProposal,
  updateProposalId,
  type Proposal,
  type CreateProposalPayload,
  type VotePayload,
  type UpdateProposalIdPayload,
} from "@/src/apis/proposals";

export const useProposals = (walletAddress: string | undefined) => {
  return useQuery<Proposal[]>({
    queryKey: ["proposals", walletAddress],
    queryFn: () => getAllProposals(walletAddress!),
    enabled: !!walletAddress,
  });
};

export const useProposal = (
  proposalId: string | number | undefined,
  walletAddress: string | undefined
) => {
  return useQuery<Proposal>({
    queryKey: ["proposals", proposalId, walletAddress],
    queryFn: () => getProposalById(proposalId!, walletAddress!),
    enabled: !!proposalId && !!walletAddress,
  });
};

export const useCreateProposal = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Proposal,
    Error,
    { payload: CreateProposalPayload; walletAddress: string }
  >({
    mutationFn: ({ payload, walletAddress }) =>
      createProposal(payload, walletAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
};

export const useVoteOnProposal = (proposalId: string | number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { payload: VotePayload; walletAddress: string }
  >({
    mutationFn: ({ payload, walletAddress }) =>
      voteOnProposal(proposalId!, payload, walletAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals", proposalId] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
};

export const useQueueProposal = (proposalId: string | number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (walletAddress) => queueProposal(proposalId!, walletAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals", proposalId] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
};

export const useExecuteProposal = (proposalId: string | number | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (walletAddress) => executeProposal(proposalId!, walletAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals", proposalId] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
};

export const useUpdateProposalId = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { payload: UpdateProposalIdPayload; walletAddress: string }
  >({
    mutationFn: ({ payload, walletAddress }) =>
      updateProposalId(payload, walletAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};
