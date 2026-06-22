import { apiFetch } from "@/lib/api";

export type DashboardStatsResponse = {
  status: string;
  data: {
    totalReports: number;
    pendingReports: number;
    activeProposals: number;
    executedProposals: number;
    reportsData: any[];
    proposalsData: any[];
    statusData: any[];
  };
};

export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  return apiFetch<DashboardStatsResponse>("/admin/dashboard-stats", {
    method: "GET",
  });
};
