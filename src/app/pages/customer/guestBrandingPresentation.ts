import type { CSSProperties } from "react";
import type { PublicGuestBranding } from "../../lib/businessBranding";
import { guestBrandAccentColor } from "../../lib/businessBranding";

export function guestCompletionIconStyle(
  branding?: PublicGuestBranding | null,
): CSSProperties {
  const accent = guestBrandAccentColor(branding);
  return {
    background: `linear-gradient(135deg, ${accent}29 0%, ${accent}14 50%, transparent 100%)`,
    boxShadow: `0 0 0 10px ${accent}12`,
  };
}

export function guestCompletionCardStyle(branding?: PublicGuestBranding | null): CSSProperties {
  const accent = guestBrandAccentColor(branding);
  return {
    borderColor: `${accent}26`,
    background: `linear-gradient(180deg, white 0%, white 55%, ${accent}0a 100%)`,
  };
}

export function guestPrimaryButtonStyle(branding?: PublicGuestBranding | null): CSSProperties {
  const accent = guestBrandAccentColor(branding);
  return {
    backgroundColor: accent,
    borderColor: accent,
  };
}

/** Premium completion page canvas — warm gradient with brand accent wash. */
export function guestSuccessPageStyle(branding?: PublicGuestBranding | null): CSSProperties {
  const accent = guestBrandAccentColor(branding);
  return {
    background: `linear-gradient(165deg, #faf8f5 0%, #f3efe8 38%, ${accent}0f 100%)`,
  };
}

/** Primary CTA on success page — accent to deep neutral gradient. */
export function guestSuccessPrimaryButtonStyle(branding?: PublicGuestBranding | null): CSSProperties {
  const accent = guestBrandAccentColor(branding);
  return {
    background: `linear-gradient(135deg, ${accent} 0%, #c45f12 42%, #1a1a1a 100%)`,
    borderColor: "transparent",
    boxShadow: `0 14px 32px -12px ${accent}66`,
  };
}
