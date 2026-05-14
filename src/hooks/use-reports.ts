import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPendingReports,
  getReportById,
  prepareProposalData,
  type Report,
  type PrepareProposalPayload,
  type PrepareProposalResponse,
  type ReportsResponse,
} from "@/src/apis/reports";

export const usePendingReports = (walletAddress: string | undefined) => {
  return useQuery<ReportsResponse>({
    queryKey: ["reports", "pending", walletAddress],
    queryFn: () => getPendingReports(walletAddress!),
    enabled: !!walletAddress,
  });
};

export const useReport = (
  reportId: string | number | undefined,
  walletAddress: string | undefined
) => {
  return useQuery<Report>({
    queryKey: ["reports", reportId, walletAddress],
    queryFn: () => getReportById(reportId!, walletAddress!),
    enabled: !!reportId && !!walletAddress,
  });
};

export const usePrepareProposalData = () => {
  const queryClient = useQueryClient();

  return useMutation<
    PrepareProposalResponse,
    Error,
    { payload: PrepareProposalPayload; walletAddress: string }
  >({
    mutationFn: ({ payload, walletAddress }) =>
      prepareProposalData(payload, walletAddress),
    onSuccess: (data, variables) => {
      // Optionally invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["reports", variables.payload.reportId],
      });
    },
  });
};
