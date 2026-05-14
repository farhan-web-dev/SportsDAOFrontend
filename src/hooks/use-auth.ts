import { useQuery } from "@tanstack/react-query";
import {
  checkAdmin,
  CheckAdminPayload,
  CheckAdminResponse,
} from "@/src/apis/auth";

export const useCheckAdmin = (walletAddress: string | undefined) => {
  return useQuery<CheckAdminResponse>({
    queryKey: ["admin", walletAddress],
    queryFn: () => checkAdmin({ walletAddress: walletAddress! }),
    enabled: !!walletAddress,
  });
};
