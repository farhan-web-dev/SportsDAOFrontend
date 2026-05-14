import { apiFetch } from "@/lib/api";

export type Report = {
  _id: string | number;
  title: string;
  description: string;
  fileIpfsHash?: string;
  ipfsLink?: string; // Keep for backward compatibility if needed
  price?: string | number;
};

export type PrepareProposalPayload = {
  reportId: string | number;
};

export type PrepareProposalResponse = {
  success: boolean;
  proposalDbId: string | number;
  target: string; // singular
  value: string | number; // singular
  data: string; // singular calldata
  description: string;
};

export type ReportsResponse = {
  data: Report[];
};

export const getPendingReports = async (
  walletAddress: string
): Promise<ReportsResponse> => {
  return apiFetch<ReportsResponse>("/reports/pending", {
    walletAddress,
  });
};

export const getReportById = async (
  reportId: string | number,
  walletAddress: string
): Promise<Report> => {
  return apiFetch<Report>(`/reports/${reportId}`, {
    walletAddress,
  });
};

export const prepareProposalData = async (
  payload: PrepareProposalPayload,
  walletAddress: string
): Promise<PrepareProposalResponse> => {
  // Validate reportId before making the request
  if (!payload.reportId) {
    throw new Error("reportId is required");
  }

  // Ensure reportId is a string (MongoDB ObjectId should be a string)
  const reportId = String(payload.reportId).trim();

  if (
    !reportId ||
    reportId === "undefined" ||
    reportId === "null" ||
    reportId === ""
  ) {
    throw new Error(`Invalid reportId: ${payload.reportId}`);
  }

  const requestBody = { reportId };

  // Ensure the body is properly formatted
  const bodyString = JSON.stringify(requestBody);

  console.log("📤 Preparing proposal request:", {
    endpoint: "/proposals/prepare-proposal",
    payload: payload,
    reportId: reportId,
    requestBody: requestBody,
    bodyString: bodyString,
    walletAddress,
  });

  // Verify the body string is valid JSON
  try {
    const parsed = JSON.parse(bodyString);
    console.log("✅ Body string is valid JSON:", parsed);
    if (!parsed.reportId) {
      throw new Error("reportId is missing from parsed body");
    }
  } catch (e) {
    console.error("❌ Body string validation failed:", e);
    throw new Error(`Invalid request body: ${e}`);
  }

  try {
    const response = await apiFetch<PrepareProposalResponse>(
      "/proposals/prepare-proposal",
      {
        method: "POST",
        body: bodyString,
        walletAddress,
      }
    );
    console.log("✅ Prepare proposal response:", response);
    return response;
  } catch (error) {
    console.error("❌ Prepare proposal error:", error);
    throw error;
  }
};
