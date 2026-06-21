import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getBusinessById } from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import type { ResolvedCustomerEmployee } from "../../lib/resolveCustomerEmployeeContext";

/** Primary — venue the guest is tipping at. */
export type CustomerJourneyVenueBrand = {
  name: string;
  logo?: string | null;
  contextLine?: ReactNode;
};

/** Secondary — team member receiving the tip. */
export type CustomerJourneyEmployeeIdentity = {
  name: string;
  role?: string | null;
};

export function venueBrandFromResolved(
  resolved: Pick<ResolvedCustomerEmployee, "businessName" | "businessLogo">,
  contextLine?: ReactNode,
): CustomerJourneyVenueBrand {
  return {
    name: resolved.businessName,
    logo: resolved.businessLogo ?? null,
    contextLine,
  };
}

export function venueBrandFromFields(
  name: string,
  logo?: string | null,
  contextLine?: ReactNode,
): CustomerJourneyVenueBrand {
  return {
    name,
    logo: logo ?? null,
    contextLine,
  };
}

export function venueBrandFromBusiness(
  business: { name: string; logo?: string | null; location?: string | null; type?: string | null },
  contextLine?: ReactNode,
): CustomerJourneyVenueBrand {
  const derivedContext =
    contextLine ??
    (business.type || business.location ? (
      [business.type, business.location].filter(Boolean).join(" · ")
    ) : undefined);

  return {
    name: business.name,
    logo: business.logo ?? null,
    contextLine: derivedContext || undefined,
  };
}

/** Resolve venue name/logo for post-payment pages that only hold `businessId`. */
export function useCustomerVenueBrand(
  businessId: string | null | undefined,
  fallbackName: string,
): CustomerJourneyVenueBrand {
  const [venue, setVenue] = useState<CustomerJourneyVenueBrand>(() => ({
    name: fallbackName,
    logo: null,
  }));

  useEffect(() => {
    const id = businessId?.trim();
    if (!id) {
      setVenue({ name: fallbackName, logo: null });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const biz = await getBusinessById(id);
        if (cancelled) return;
        setVenue({
          name: biz?.name?.trim() || fallbackName,
          logo: biz?.logo ?? null,
        });
      } catch (err) {
        logClientError("useCustomerVenueBrand", err);
        if (!cancelled) setVenue({ name: fallbackName, logo: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId, fallbackName]);

  return venue;
}
