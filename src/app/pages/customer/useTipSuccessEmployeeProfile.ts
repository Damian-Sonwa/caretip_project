import { useEffect, useState } from "react";
import { getEmployeeById } from "../../lib/api";
import { logClientError } from "../../lib/clientLog";

export type TipSuccessEmployeeProfile = {
  name: string;
  avatar: string | null;
  role: string | null;
  bio: string | null;
};

/** Optional public profile enrichment for the completion screen (display only). */
export function useTipSuccessEmployeeProfile(
  employeeId: string | null | undefined,
  fallback: TipSuccessEmployeeProfile,
): TipSuccessEmployeeProfile {
  const [profile, setProfile] = useState<TipSuccessEmployeeProfile>(fallback);

  useEffect(() => {
    setProfile(fallback);
  }, [fallback.name, fallback.avatar, fallback.role, fallback.bio]);

  useEffect(() => {
    const id = employeeId?.trim();
    if (!id) return;

    let cancelled = false;
    void (async () => {
      try {
        const row = await getEmployeeById(id);
        if (cancelled || !row) return;
        setProfile({
          name: row.name?.trim() || fallback.name,
          avatar: row.avatar ?? fallback.avatar,
          role: row.role?.trim() || fallback.role,
          bio: row.bio?.trim() || null,
        });
      } catch (err) {
        logClientError("useTipSuccessEmployeeProfile", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [employeeId, fallback.name, fallback.avatar, fallback.role, fallback.bio]);

  return profile;
}
