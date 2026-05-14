import { apiFetch } from "@/lib/api";

export type CheckAdminPayload = {
  walletAddress: string;
};

export type CheckAdminResponse = {
  isAdmin: boolean;
};

export const checkAdmin = async (
  payload: CheckAdminPayload
): Promise<CheckAdminResponse> => {
  return apiFetch<CheckAdminResponse>("/admin/check-admin", {
    method: "POST",
    body: JSON.stringify({ walletAddress: payload.walletAddress }),
  });
};
