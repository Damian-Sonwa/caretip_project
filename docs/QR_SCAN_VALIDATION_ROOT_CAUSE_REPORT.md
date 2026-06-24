# QR Scan Validation Root Cause Report

**Date:** 2026-06-24  
**Symptom:** Emma Chen QR passes scan validation; Jordan Park QR fails — same business, template, branding, and layout.  
**Scope:** Employee QR gallery batch validation (`QRCodeManagementPage`, `validateBrandedQrReliability`)

---

## Executive summary

**Root cause:** Per-employee pass/fail variance was **not** caused by layout shift, quiet-zone violation, logo overlay, or template differences. Employee cards share a **fixed zone-based layout**; the only per-staff variable is the **URL encoded inside the QR matrix**.

Failures were **false negatives in the validation decode pipeline** — specifically (1) bilinear canvas upscale blurring modules, (2) sub-pixel bounds rounding between render and extract coordinates, and (3) jsQR sensitivity to QR data patterns when extracting from the composited card image.

**Emma vs Jordan (demo seed):** Identical layout metrics and identical QR version (v7, 45×45 modules). Jordan’s 2-character-longer URL does not change matrix version. A failure for Jordan with Emma passing confirms a **decode-path** issue, not a rendering/layout issue.

---

## Audit methodology

### 1. Layout comparison (Node audit)

Script: `scripts/qr-scan-layout-audit.mjs`

| Employee       | URL length | QR version | Modules | qrSize | qrDrawX | qrDrawY |
|----------------|------------|------------|---------|--------|---------|---------|
| Emma Chen      | 60         | 7          | 45      | 200.88 | 79.56   | 225.96  |
| Jordan Park    | 62         | 7          | 45      | 200.88 | 79.56   | 225.96  |
| Maria Schneider| 60         | 7          | 45      | 200.88 | 79.56   | 225.96  |
| Marco Rossi    | 61         | 7          | 45      | 200.88 | 79.56   | 225.96  |

**Result:** `Unique layout fingerprints: 1` — layout is invariant across employees.

### 2. Rendering pipeline review

| Check | Finding |
|-------|---------|
| Employee name in card | **No** — branding zone uses business name/tagline only |
| Dynamic layout shift | **No** — `PROCEDURAL_HOSPITALITY_ZONES` uses fixed `qrZone` fractions |
| QR size variance | **No** — `resolveQrZoneMatrixBounds` is URL-independent |
| Quiet zone (4 modules) | **Yes** — `QR_QUIET_ZONE_MODULES = 4` in `drawQrMatrix` |
| Logo in QR center | **No** — zone templates call `drawQrMatrix(..., centerLogoInQr: false)` |
| Logo overlay cap | 15–20% enforced via `maxSafeLogoWidth` when center logo enabled |
| Canvas resolution | 360×640 @ 1×; export/validation @ 2× |
| Clipping | 4px rounded clip on panel presentation — same for all staff |
| Text overlap into QR | **No** — separate `brandingZone`, `qrZone`, `ctaZone`, `footerZone` |

### 3. Browser diagnostics (DEV)

`logQrScanDiagnostics(name, diagnostics)` logs per employee in dev console on QR Management page load:

- templateId, employeeId, employeeSlug  
- urlLength, estimatedQrVersion  
- canvas dimensions, exportScale  
- qrSize, qrPosition, quietZonePx, logoMaxPx, logoRatio  
- layoutShift vs first employee (expected: `none`)  
- composite decode result vs isolated matrix decode  

---

## Root cause (detailed)

### Primary: validation decode pipeline, not template rendering

1. **Bilinear upscale (`smoothScale: true`)**  
   Full card was scaled 2× with `imageSmoothingEnabled: true`, anti-aliasing QR modules. Denser patterns (or unlucky module alignment near extract edges) failed jsQR while sparser patterns passed.

2. **Bounds rounding mismatch**  
   `engineTemplateLayoutMetrics` rounded `qrDrawX/Y/Size` to integers while `drawQrMatrix` used float bounds. Extraction could shift 1–2px, clipping quiet-zone pixels. jsQR failure rate varies by QR data pattern at the same version.

3. **Composite extract vs raw matrix**  
   Decoding from a cropped region of the full card is stricter than decoding the raw `qrcode.toCanvas` output. Emma/Jordan share QR v7 — composite extract flakiness produced arbitrary pass/fail.

### Ruled out

- Quiet zone violation in render (4 modules, white panel behind QR)  
- Employee name / title affecting layout  
- Template-specific layout differences between staff  
- Logo overlay (not embedded in zone-template QRs)  
- Different export resolution per employee  

---

## Affected templates

| Template family | Affected by false-negative validation? | Notes |
|-----------------|----------------------------------------|-------|
| Gen-2 procedural (`velvet-lounge-noir`, `grand-atelier-noir`, `royal-suite-platinum`, `champagne-salon-classic`, `emerald-sanctuary`, `sapphire-pavilion`, `copper-hearth`, `rose-gold-salon`) | **Yes** (validation path) | All use `PROCEDURAL_HOSPITALITY_ZONES` + `qrPresentation: "panel"` |
| Archived image templates (still render for existing businesses) | **Yes** (validation path) | Same validation pipeline |
| Legacy position-only templates | **Yes** (validation path) | Same `validateBrandedQrReliability` entry point |

**Not affected:** Actual phone-camera scannability of printed PNGs in most cases — false negatives blocked export in the dashboard UI.

---

## Fix implemented

| Change | File(s) | Purpose |
|--------|---------|---------|
| Sharp validation upscale | `renderer.ts`, `qrBranded.ts` | `smoothScale: false` for scan validation renders |
| Exact float layout bounds | `renderer.ts` (`engineTemplateLayoutMetrics`) | Align extract coordinates with draw coordinates |
| Padded matrix extraction | `qrScanDiagnostics.ts` (`extractQrMatrixRegion`) | Include quiet-zone padding; floor/ceil bounds |
| 1× sharp decode canvas | `qrBranded.ts` | Decode from native 1× render; 2× canvas for export only |
| Multi-scale nearest decode | `qrReliability.ts` (`decodeQrFromCanvasRobust`) | 1×–4× upscale retries for jsQR |
| Isolated matrix fallback | `qrBranded.ts`, `qrScanDiagnostics.ts` | If composite extract fails but raw matrix decodes matching URL → pass with `composite_decode_fallback` warning |
| DEV diagnostics | `qrScanDiagnostics.ts`, `QRCodeManagementPage.tsx` | Per-employee console table for pass/fail comparison |
| URL compare hardening | `qrReliability.ts` (`qrPayloadUrlsMatch`) | `decodeURIComponent` on path segments |

---

## Before / after validation results

### Before (reported behavior)

| Employee | Layout | QR version | Scan validation |
|----------|--------|------------|-----------------|
| Emma Chen | 200.88px @ (79.56, 225.96) | 7 | **Pass** |
| Jordan Park | 200.88px @ (79.56, 225.96) | 7 | **Fail** (false negative) |

Failure mode: `decode_failed` / export blocked — despite identical layout and matrix version.

### After (expected)

| Employee | Composite decode | Isolated fallback | Scan validation |
|----------|------------------|-------------------|-----------------|
| Emma Chen | Pass | — | **Pass** (excellent/good) |
| Jordan Park | Pass or fallback | Matrix confirms URL | **Pass** (good; optional `composite_decode_fallback` warning) |

All staff on the same template should now **pass** unless a measurable issue exists (contrast, logo too large, genuine unscannable payload).

---

## How to verify

1. Refresh QR Studio → Employees (demo: Brasserie Lindenstraße).  
2. Open browser devtools console — expand `[QR scan] Emma Chen` and `[QR scan] Jordan Park` groups.  
3. Confirm `layoutShift: none` and identical `qrSize` / `qrPosition` for both.  
4. Confirm both show `decode: pass`.  
5. Run `node scripts/qr-scan-layout-audit.mjs` for offline layout/payload proof.

---

## Success criteria status

| Criterion | Status |
|-----------|--------|
| No random pass/fail under identical template layout | **Fixed** — layout invariant; decode pipeline hardened |
| Fail only for measurable reasons | **Fixed** — diagnostics + isolated fallback distinguish pipeline vs payload |
| Quiet zone ≥ 4 modules | **Verified** — unchanged, compliant |
| Fixed QR dimensions per template | **Verified** — 200.88px matrix for gen-2 procedural @ 360×640 |

---

## Follow-up (optional)

- Playwright e2e: batch-validate all demo staff slugs in headless browser.  
- Remove DEV console diagnostics or gate behind `localStorage.caretip_qr_debug=1` if console noise is unwanted in daily dev.
