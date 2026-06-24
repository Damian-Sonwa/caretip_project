# PDF Export Parity Fix Report

**Date:** 2026-06-24  
**Bug:** QR Studio preview and employee gallery cards showed the selected branded template, but PDF export (single, bulk, print-via-PDF) produced a different Helvetica “CareTip default” layout.  
**Severity:** Critical — breaks user trust in WYSIWYG export.

---

## Executive summary

PDF export used a **separate legacy layout system** (`renderStandardQrPdfLayout`) that rebuilt cards in jsPDF with Helvetica text, a separate logo slot, and a small centered QR square. Bulk export additionally called `renderBrandedQRToDataUrl()` **without branding**, forcing default template.

**Fix:** All PDF and print paths now embed the **exact Template Engine canvas** (same PNG as preview). No alternate PDF template. Bulk export reuses gallery `qrImages` cache or re-renders with `qrBrand`.

---

## Root cause

### 1. Legacy PDF layout (`qrPrintPdf.ts`)

`renderStandardQrPdfLayout` implemented an independent design:

- Helvetica bold business/employee name  
- Optional separate business logo (not template logo zone)  
- Branded canvas image shrunk to a **QR-sized square** in the page center  
- Hardcoded “Scan to tip instantly” + “Thank you” footer  

The input `qrPngDataUrl` was the **full branded template card** from `renderBrandedQrUrlToCanvas`, but the PDF layer **ignored** template background, typography, CTA pill, social links, and footer styling.

### 2. Bulk PDF double failure (`qrBulkPdf.ts`)

1. Re-rendered each employee with `renderBrandedQRToDataUrl(slug, slug)` — **no `qrBrand` / template ID** → default CareTip template.  
2. Wrapped result in the same legacy Helvetica PDF layout.

### 3. Print used legacy PDF wrapper

`handleEmployeePrint` / `handleVenueQrPrint` generated a legacy-layout PDF and opened the browser print dialog — not the preview image.

---

## Export path audit

### Before

| Action | Entry point | Renderer | Template used |
|--------|-------------|----------|---------------|
| QR Studio preview | `QrStudioDesigner` → `renderBrandedQrUrlToCanvas` | **Template Engine** | Selected template |
| Gallery / employee cards | `validateBrandedQrReliability` → canvas `toDataURL` | **Template Engine** | Selected template |
| Download PNG | `downloadQrDataUrlPng(previewDataUrl)` | **Template Engine** (cached PNG) | Selected template |
| Download PDF Layout (employee) | `downloadEmployeeQrPrintPdf` | **Legacy `renderStandardQrPdfLayout`** | Helvetica default card |
| Download PDF Layout (venue) | `downloadBusinessQrPrintPdf` | **Legacy `renderStandardQrPdfLayout`** | Helvetica default card |
| Print (employee / venue) | `createEmployeeQrPrintPdf` / `createBusinessQrPrintPdf` → print blob | **Legacy PDF layout** | Helvetica default card |
| Download All PDFs | `downloadStaffQrPdf` | **Default branding re-render** + legacy layout | Wrong template + wrong layout |

### After

| Action | Entry point | Renderer | Template used |
|--------|-------------|----------|---------------|
| QR Studio preview | `renderBrandedQrUrlToCanvas` | Template Engine | Selected template |
| Gallery cards | `validateBrandedQrReliability` | Template Engine | Selected template |
| Download PNG | `downloadQrDataUrlPng` | Template Engine PNG | Selected template |
| Download PDF Layout | `downloadEmployeeQrPrintPdf` / `downloadBusinessQrPrintPdf` → `createBrandedTemplateCardPdf` | **Embed full template PNG** | Selected template |
| Print | `printQrDataUrl` | **Same PNG as preview** | Selected template |
| Download All PDFs | `downloadStaffQrPdf` with `branding` + `resolveCardDataUrl` | **Embed full template PNG per page** | Selected template |

---

## Architecture (after fix)

```
Selected template + branding (qrBrand)
              ↓
     Template Engine
   renderQrTemplateCard()
   renderBrandedQrUrlToCanvas()
              ↓
    ┌─────────┴─────────┐
    ↓         ↓         ↓
 Preview    PNG      canvas.toDataURL()
              ↓
    ┌─────────┴─────────────────┐
    ↓                           ↓
printQrDataUrl()     createBrandedTemplateCardPdf()
 (Print)              embedBrandedTemplateCardOnPage()
                              ↓
                     PDF download / bulk PDF
```

**Single source of truth:** Template Engine canvas → all outputs.

---

## Files updated

| File | Change |
|------|--------|
| `src/app/lib/qrPrintPdf.ts` | Removed `renderStandardQrPdfLayout`. Added `createBrandedTemplateCardPdf`, `embedBrandedTemplateCardOnPage`, `loadBrandedCardDimensions`. |
| `src/app/lib/qrBulkPdf.ts` | Rewritten: one full branded card per A4 page; accepts `branding` + `resolveCardDataUrl`. |
| `src/app/pages/business/QRCodeManagementPage.tsx` | Bulk PDF passes `qrBrand` + `qrImages`; print uses `printQrDataUrl`; removed legacy logo/PDF layout params. |

---

## Validation checklist

For every employee / venue QR under a selected template:

| Check | Status |
|-------|--------|
| Template matches preview | **Yes** — same PNG pixels |
| Background matches preview | **Yes** |
| QR position matches preview | **Yes** |
| Logo matches preview | **Yes** |
| Business name matches preview | **Yes** |
| Address / tagline matches preview | **Yes** |
| CTA matches preview | **Yes** |
| Social links match preview | **Yes** |
| Colors match preview | **Yes** |
| Typography matches preview | **Yes** |

No visual differences — PDF/print are scaled embeds of the preview canvas, not re-laid-out documents.

---

## How to verify

1. Open **QR Studio** → select e.g. **Velvet Lounge Noir** (or any template).  
2. Open **QR Studio → Employees** (or Gallery). Confirm card preview matches designer.  
3. **Download PDF Layout** on one employee → PDF should match preview exactly (full card, not Helvetica layout).  
4. **Print** → browser print preview shows the branded card image.  
5. **Download All PDFs** → every page should match gallery cards (same template/colors).  
6. Change template in branding → regenerate / refresh → all exports should update together.

---

## Legacy cleanup

| Removed / retired | Notes |
|-------------------|-------|
| `renderStandardQrPdfLayout` | Deleted — was the alternate PDF design system |
| Helvetica header/footer PDF composition | Deleted |
| Bulk `renderBrandedQRToDataUrl()` without branding | Fixed — passes `opts.branding` |
| `loadLogoPngForPdf` in QR management page | Removed — logo comes from template engine |
| Print-via-legacy-PDF blob | Replaced with `printQrDataUrl` (direct image print) |

---

## Success criteria

**Met:** When a business selects any template in QR Studio, every export action (PNG, PDF, Print, Bulk PDF) produces the **exact same branded design** shown in the preview. No fallback templates, no alternate Helvetica card, no visual mismatches.
