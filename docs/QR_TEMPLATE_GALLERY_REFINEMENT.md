# QR Template Gallery Refinement

**Date:** 2026-06-24  
**Goal:** Move the template system toward generation-2 scan-first layouts while preserving engine support for existing business selections.

**Design priority order:** Scanability → Branding → Aesthetics

---

## Summary of changes

| Area | Action |
|------|--------|
| Gallery | 8 first-generation image templates **archived** (hidden from picker) |
| Gallery | 4 second-generation procedural templates **retained** as foundation |
| Default template | `velvet-lounge-noir` (was `industry`) for new businesses |
| QR zone | Enlarged ~29% width, ~33% height on procedural layout |
| Logo | ~42% wider slot, ~25% taller within branding zone |
| Typography | +20–27% `maxFontSize` on primary fields; line-height 1.35× |
| Quiet zone | Internal QR padding 4% → 5% of zone |

**Engine registry:** All 13 template IDs remain registered. Businesses with archived templates continue to export and print correctly.

---

## Removed from gallery (archived)

These templates remain in `QR_TEMPLATE_ENGINE_REGISTRY` with `gallery: false`. They are **not** shown in QR Studio Templates or the branding picker.

| Template ID | Former label | Reason archived |
|-------------|--------------|-----------------|
| `industry` | Luxury Gold | Narrow gold-frame artwork; QR competes with decorative border |
| `velvet-lounge` | Velvet Lounge | Image shell; generation-1 framing |
| `grand-atelier` | Grand Atelier | **Worst QR compression** — zone width 44%, branding height 22% |
| `royal-suite` | Royal Suite | Decorative coastal frame; branding secondary to artwork |
| `champagne-salon` | Champagne Salon | Marble café frame; branding zone height only 18% |
| `serenity-spa` | Serenity Spa | Decorative wellness shell; moderate but gen-1 layout |
| `art-deco-noir` | Art Deco Noir | Ornate border competes with scan zone |
| `gallery-pavilion` | Gallery Pavilion | **Smallest QR** — zone width 40%, height 26% |

### Archived zone metrics (360×480 canvas, normalized)

| Template | QR zone (w × h) | Branding zone h | Issue |
|----------|-----------------|-----------------|-------|
| `grand-atelier` | 0.44 × 0.30 | 0.22 | Compressed branding + narrow QR |
| `gallery-pavilion` | 0.40 × 0.26 | 0.20 | QR too small for distance scanning |
| `champagne-salon` | 0.52 × 0.38 | 0.18 | Name/address squeezed |
| `industry` | 0.656 × 0.328 | 0.284 | Decorative gold frame steals focus |
| `velvet-lounge` | 0.60 × 0.35 | 0.30 | Acceptable QR but gen-1 image path |
| `royal-suite` | 0.64 × 0.38 | 0.28 | Decorative resort frame |
| `serenity-spa` | 0.55 × 0.37 | 0.30 | Decorative spa shell |
| `art-deco-noir` | 0.61 × 0.35 | 0.315 | Ornate art-deco border |

---

## Retained in gallery (generation 2)

| Template ID | Label | Mood | Notes |
|-------------|-------|------|-------|
| `velvet-lounge-noir` | Velvet Lounge Noir | Burgundy / noir lounge | **Default** for Starter + new signups |
| `grand-atelier-noir` | Grand Atelier Noir | Graphite / fine dining | Double-framed noir procedural |
| `royal-suite-platinum` | Royal Suite Platinum | Navy / platinum suite | Resort & hotel mood |
| `champagne-salon-classic` | Champagne Salon Classic | Ivory / champagne editorial | Light variant for daytime venues |
| `emerald-sanctuary` | Emerald Sanctuary | Emerald / wellness | Spas, retreats, garden venues |
| `sapphire-pavilion` | Sapphire Pavilion | Sapphire / jewel blue | Coastal clubs, rooftop bars |
| `copper-hearth` | Copper Hearth | Copper / warm hearth | Bistros, brasseries, fireside dining |
| `rose-gold-salon` | Rose Gold Salon | Rose gold / blush | Patisseries, salons, daytime boutique |

All eight share **`PROCEDURAL_HOSPITALITY_ZONES`** — one consistent scan-first layout; only procedural background palette varies.

---

## New quality rules (template design standard)

Every gallery template **must** reserve dedicated regions:

| Region | Purpose | Rules |
|--------|---------|-------|
| **Logo** | Brand mark | Min 34% of branding zone width; never overlap QR; aspect ratio preserved |
| **Business name** | Primary identity | Largest text in branding stack; uppercase optional; min 18px @ 360px canvas |
| **Address** | Venue location | Readable at arm's length; min 10px; medium weight |
| **QR code** | Scan target | **Dominant visual element**; min 62% card width × 40% card height zone |
| **CTA** | Tip action | High contrast pill; min 11px bold uppercase |
| **Thank-you / footer** | Gratitude + contact | Clear hierarchy below CTA |
| **Website / social** | Optional links | Never compete with QR or business name |

### QR priority rule

1. QR is the **largest** single element on the card.
2. QR sits inside a **white panel** with ≥5% internal quiet-zone padding.
3. Decorative backgrounds **must not** intrude into the QR panel.
4. Artwork variations change **color and atmosphere only**, not layout geometry.

### Forbidden patterns (generation 1)

- Marble photo frames with narrow inner content windows
- Gold filigree borders that shrink the QR matrix
- Branding zones under 28% card height when logo + name + address are visible
- QR zones under 55% card width on hospitality cards

---

## Layout adjustments (generation 2 procedural)

### Zone map — before → after

| Zone | Before (norm.) | After (norm.) | Change |
|------|----------------|---------------|--------|
| `brandingZone` w × h | 0.88 × 0.34 | 0.90 × 0.30 | Slightly wider; vertical space traded to QR |
| `qrZone` w × h | 0.48 × 0.30 | **0.62 × 0.40** | **+29% width, +33% height** |
| `ctaZone` y | 0.66 | 0.72 | Moved below larger QR |
| `footerZone` y | 0.75 | 0.79 | Adjusted for new QR footprint |
| `qrSafeZone.padding` | 0.04 | 0.05 | Stronger quiet zone |

### QR pixel size @ 360×640 canvas (approx.)

| Metric | Before | After |
|--------|--------|-------|
| QR zone width | 173 px | **223 px** |
| QR zone height | 192 px | **256 px** |
| Matrix size (min of inner dims) | ~166 px | **~230 px** (+38%) |

---

## Logo sizing adjustments

| Setting | Before | After | Δ |
|---------|--------|-------|---|
| `positions.logo.w` | 0.24 | **0.34** | +42% width |
| `positions.logo.h` | 0.40 | **0.50** | +25% height |
| Branding stack logo slot | `rect.h × 0.40` | `rect.h × 0.50` | +25% vertical allocation |

Logos scale within the slot with aspect ratio preserved (`drawLogoInRect`). They never overlap the QR panel.

---

## Typography adjustments

### `maxFontSize` (canvas px @ 360pt width)

| Field | Dark luxury (before → after) | Champagne (before → after) |
|-------|------------------------------|----------------------------|
| Business name | 15 → **19** (+27%) | 14 → **18** (+29%) |
| Address | 8 → **10** (+25%) | 8 → **10** |
| CTA | 9 → **11** (+22%) | 9 → **11** |
| Thank-you | 8 → **10** (+25%) | 8 → **10** |
| Tagline | 9 → **11** | 9 → **11** |
| Welcome | 8 → **10** | 8 → **10** |
| Phone / website | 6.5 → **8** | 6.5 → **8** |

### Line-height & hierarchy

| Setting | Before | After |
|---------|--------|-------|
| Text line-height multiplier | 1.22–1.25× | **1.35×** |
| Business name stack weight | 0.26 | **0.32** |
| Address stack weight | 0.14 | **0.16** |
| Address font weight | 400 | **500** |

---

## Future template palette (roadmap)

New gallery templates should be **procedural mood variants** on `PROCEDURAL_HOSPITALITY_ZONES` — not new frame structures:

| Mood | Working name | Base variant |
|------|--------------|--------------|
| Noir | Velvet Lounge Noir | `velvet-lounge` *(shipped)* |
| Platinum | Royal Suite Platinum | `royal-suite` *(shipped)* |
| Champagne | Champagne Salon Classic | `champagne-salon` *(shipped)* |
| Graphite | Grand Atelier Noir | `grand-atelier` *(shipped)* |
| Emerald | *(planned)* | New procedural palette |
| Sapphire | *(planned)* | New procedural palette |
| Ivory | *(planned)* | Light editorial |
| Copper | *(planned)* | Warm metallic accent |
| Rose Gold | *(planned)* | Soft luxury |

---

## Code references

| File | Change |
|------|--------|
| `src/app/lib/qrTemplateEngine/registry.ts` | `gallery: false` on 8 image templates; `GALLERY_DEFAULT_TEMPLATE_ID` |
| `src/app/lib/qrTemplateEngine/luxuryTemplateShared.ts` | Zones, logo, typography tokens |
| `src/app/lib/qrTemplateEngine/renderer.ts` | Line-height 1.35×; branding stack weights |
| `src/app/lib/qrTemplateStyles.ts` | `QR_TEMPLATE_IDS` (4 gallery); default `velvet-lounge-noir` |
| `backend/src/lib/qrBrandingValidation.ts` | Default template ID |
| `backend/prisma/schema.prisma` | Default for new `Business` rows |

---

## Migration & compatibility

| Scenario | Behavior |
|----------|----------|
| Business saved on `industry` (or any archived ID) | Still renders and exports via `getEngineTemplate()` |
| Business opens branding picker | If saved template not in gallery, UI shows first gallery template until user picks a new one; saved ID preserved until explicit change |
| Legacy DB values (`classic`, `luxury`, …) | Normalized to `velvet-lounge-noir` via `normalizeQrTemplateId()` |
| Starter tier lock | Free template = `velvet-lounge-noir` (was `industry`) |

---

## Success criteria

- [ ] Guest can identify venue name from **6+ feet** on a printed 4×6 card
- [ ] QR matrix is visually the **largest** element on every gallery template
- [ ] Logo reads as intentional branding, not a thumbnail
- [ ] Gallery shows **4** scan-first templates with consistent layout
- [ ] Archived templates never appear in picker but still export for existing selections
- [ ] `validateBrandedQrReliability` passes at export scale on all gallery templates

---

## Verification checklist

1. Open **QR Studio → Templates** — confirm 4 cards only (Noir, Atelier Noir, Platinum, Classic).
2. Open **QR Studio → Branding** — preview with long business name + address; confirm readability.
3. Export PNG at 2× scale — run reliability panel; QR should pass contrast + quiet zone.
4. Load a business still on `industry` via API — confirm export still works (archived, not deleted).
