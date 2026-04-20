import type { TippingVenuePayload } from "../context/TipFlowContext";

export const DEV_BYPASS_ENABLED = import.meta.env.DEV;

export const DEV_MOCK = {
  businessId: "dev_business_001",
  employeeId: "dev_employee_001",
  employeeName: "Dev Team Member",
  employeeAvatar: null as string | null,
  amount: 15,
  venue: {
    locationId: "dev_location_001",
    tableId: "dev_table_001",
    locationName: "Dev Location",
    tableName: "Table 1",
    qrSlug: "dev-qr",
  } satisfies TippingVenuePayload,
  /**
   * Not a real Stripe session. In DEV we allow `/rating` to render using mock
   * context and skip server verification calls when this id is present.
   */
  sessionId: "dev_session_001",
} as const;

