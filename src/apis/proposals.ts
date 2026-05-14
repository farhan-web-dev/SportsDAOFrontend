import { apiFetch } from "@/lib/api";

export type Proposal = {
  _id?: string;
  proposalId?: string;
  title?: string;
  description: string;
  status?: string; // String like "PENDING", "ACTIVE", etc.
  target?: string; // Singular, not array
  value?: string | number; // Can be string or number (0 is valid)
  calldata?: string; // Singular, not array
  reportId?: {
    _id?: string;
    title?: string;
    description?: string;
    [key: string]: any;
  };
};

export type CreateProposalPayload = {
  targets: string[];
  values: string[];
  calldatas: string[];
  description: string;
  reportId?: string | number;
};

export type VotePayload = {
  support: number; // 0 = against, 1 = for
};

export const getAllProposals = async (
  walletAddress: string
): Promise<Proposal[]> => {
  return apiFetch<Proposal[]>("/proposals/all-proposals", {
    walletAddress,
  });
};

export const getProposalById = async (
  proposalId: string | number,
  walletAddress: string
): Promise<Proposal> => {
  return apiFetch<Proposal>(`/proposals/${proposalId}`, {
    walletAddress,
  });
};

export const createProposal = async (
  payload: CreateProposalPayload,
  walletAddress: string
): Promise<Proposal> => {
  return apiFetch<Proposal>("/proposals/prepare-proposal", {
    method: "POST",
    body: JSON.stringify(payload),
    walletAddress,
  });
};

export const voteOnProposal = async (
  proposalId: string | number,
  payload: VotePayload,
  walletAddress: string
): Promise<void> => {
  return apiFetch<void>(`/proposals/${proposalId}/vote`, {
    method: "POST",
    body: JSON.stringify(payload),
    walletAddress,
  });
};

export const queueProposal = async (
  proposalId: string | number,
  walletAddress: string
): Promise<void> => {
  return apiFetch<void>(`/proposals/${proposalId}/queue`, {
    method: "POST",
    walletAddress,
  });
};

export const executeProposal = async (
  proposalId: string | number,
  walletAddress: string
): Promise<void> => {
  return apiFetch<void>(`/proposals/${proposalId}/execute`, {
    method: "POST",
    walletAddress,
  });
};

export type UpdateProposalIdPayload = {
  proposalDbId: string | number | null;
  proposalId: string;
};

export const updateProposalId = async (
  payload: UpdateProposalIdPayload,
  walletAddress: string
): Promise<void> => {
  return apiFetch<void>("/proposals/update-proposal-id", {
    method: "POST",
    body: JSON.stringify(payload),
    walletAddress,
  });
};
