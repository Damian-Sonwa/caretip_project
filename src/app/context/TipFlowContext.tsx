import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface TipFlowState {
  businessId: string | null;
  employeeId: string | null;
  employeeName: string | null;
  employeeAvatar: string | null;
  /** When customer started from `/staff/:slug` public profile — used for post-tip navigation */
  staffProfileSlug: string | null;
  /** Table QR flow: optional venue for reporting and UI */
  locationId: string | null;
  tableId: string | null;
  tippingLocationName: string | null;
  tippingTableName: string | null;
  /** Slug segment for `/table/:qrSlug` (back navigation) */
  tableQrSlug: string | null;
  amount: number | null;
  billAmount: number;
}

export interface TippingVenuePayload {
  locationId: string;
  tableId: string;
  locationName: string;
  tableName: string;
  qrSlug: string;
}

interface TipFlowContextValue extends TipFlowState {
  setBusinessId: (id: string | null) => void;
  setEmployee: (id: string, name: string, avatar?: string) => void;
  setStaffProfileSlug: (slug: string | null) => void;
  setTippingVenue: (venue: TippingVenuePayload | null) => void;
  setAmount: (amount: number) => void;
  setBillAmount: (amount: number) => void;
  reset: () => void;
}

const defaultState: TipFlowState = {
  businessId: null,
  employeeId: null,
  employeeName: null,
  employeeAvatar: null,
  staffProfileSlug: null,
  locationId: null,
  tableId: null,
  tippingLocationName: null,
  tippingTableName: null,
  tableQrSlug: null,
  amount: null,
  billAmount: 85,
};

const TipFlowContext = createContext<TipFlowContextValue | null>(null);

export function TipFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TipFlowState>(defaultState);

  const setBusinessId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, businessId: id }));
  }, []);

  const setEmployee = useCallback(
    (id: string, name: string, avatar?: string) => {
      setState((prev) => ({
        ...prev,
        employeeId: id,
        employeeName: name,
        employeeAvatar: avatar ?? prev.employeeAvatar,
      }));
    },
    []
  );

  const setStaffProfileSlug = useCallback((slug: string | null) => {
    setState((prev) => ({ ...prev, staffProfileSlug: slug }));
  }, []);

  const setTippingVenue = useCallback((venue: TippingVenuePayload | null) => {
    setState((prev) =>
      venue
        ? {
            ...prev,
            locationId: venue.locationId,
            tableId: venue.tableId,
            tippingLocationName: venue.locationName,
            tippingTableName: venue.tableName,
            tableQrSlug: venue.qrSlug,
          }
        : {
            ...prev,
            locationId: null,
            tableId: null,
            tippingLocationName: null,
            tippingTableName: null,
            tableQrSlug: null,
          }
    );
  }, []);

  const setAmount = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, amount }));
  }, []);

  const setBillAmount = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, billAmount: amount }));
  }, []);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  const value: TipFlowContextValue = {
    ...state,
    setBusinessId,
    setEmployee,
    setStaffProfileSlug,
    setTippingVenue,
    setAmount,
    setBillAmount,
    reset,
  };

  return (
    <TipFlowContext.Provider value={value}>{children}</TipFlowContext.Provider>
  );
}

export function useTipFlow() {
  const ctx = useContext(TipFlowContext);
  if (!ctx) {
    throw new Error("useTipFlow must be used within TipFlowProvider");
  }
  return ctx;
}

export function useTipFlowOptional() {
  return useContext(TipFlowContext);
}
