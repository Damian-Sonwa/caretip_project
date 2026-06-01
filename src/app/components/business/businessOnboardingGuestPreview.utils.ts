const STAFF_TONES = ["from-orange-400 to-amber-500", "from-rose-400 to-orange-400"] as const;

const STAFF_ROLE_KEYS: Record<string, readonly [string, string]> = {
  Restaurant: ["server", "host"],
  Hotel: ["concierge", "housekeeping"],
  Salon: ["stylist", "colorist"],
  Bar: ["bartender", "server"],
  Cafe: ["barista", "server"],
  Other: ["teamMember", "teamMember"],
};

export type PreviewStaffSlot = {
  initials: string;
  roleKey: string;
  tone: (typeof STAFF_TONES)[number];
  isPlaceholder: boolean;
};

export function buildPreviewStaffSlots(
  businessName: string,
  businessType: string,
): PreviewStaffSlot[] {
  const roleKeys = previewStaffRoleKeys(businessType);
  const trimmed = businessName.trim();
  if (!trimmed) {
    return STAFF_TONES.map((tone, i) => ({
      initials: "?",
      roleKey: roleKeys[i]!,
      tone,
      isPlaceholder: true,
    }));
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const initials: string[] = [];

  if (words.length >= 2) {
    initials.push(
      `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase(),
      words[1]!.length > 1
        ? `${words[1]![0]}${words[1]![1]}`.toUpperCase()
        : `${words[0]![1] ?? ""}${words[1]![0] ?? ""}`.toUpperCase(),
    );
  } else {
    const w = words[0]!;
    initials.push(
      w.slice(0, 2).toUpperCase(),
      w.length > 2 ? `${w[0]}${w[2]}`.toUpperCase() : `${w[0] ?? "?"}M`,
    );
  }

  return initials.slice(0, 2).map((initialsValue, i) => ({
    initials: initialsValue.slice(0, 2),
    roleKey: roleKeys[i]!,
    tone: STAFF_TONES[i]!,
    isPlaceholder: false,
  }));
}

export function previewStaffRoleKeys(businessType: string): readonly [string, string] {
  return STAFF_ROLE_KEYS[businessType] ?? STAFF_ROLE_KEYS.Other;
}
