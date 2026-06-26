import { resolveBusinessVerificationNoticeState } from "../lib/businessVerificationNotice";
import { useAuth } from "./useAuth";

export function useBusinessVerificationNotice() {
  const { user } = useAuth();
  return resolveBusinessVerificationNoticeState(user);
}
