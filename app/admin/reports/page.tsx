"use client";

import { useAccount } from "wagmi";
import ReportCard from "@/src/components/ReportCard";
import { usePendingReports } from "@/src/hooks/use-reports";

export default function ReportsPage() {
  const { address } = useAccount();
  const {
    data: reports,
    isLoading: loading,
    error,
  } = usePendingReports(address);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Reports</h1>
        <p className="text-muted-foreground">
          Review and manage pending reports
        </p>
      </div>

      {loading && <p>Loading reports...</p>}
      {error && (
        <p className="text-red-600">
          {error instanceof Error ? error.message : "Failed to fetch reports"}
        </p>
      )}

      <div className="space-y-4">
        {reports?.data?.length === 0 && !loading && (
          <p className="text-muted-foreground">No pending reports</p>
        )}
        {reports?.data?.map((report) => (
          <ReportCard key={report._id} report={report} showActions />
        ))}
      </div>
    </div>
  );
}
