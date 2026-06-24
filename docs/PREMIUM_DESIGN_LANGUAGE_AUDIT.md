# CareTip Premium Design Language Audit

**Generated:** 2026-06-24  
**Source of truth:** Landing page Final CTA (`caretip-landing-final-cta-footer-refine.css`)

---

## Objective

Standardize dashboard premium surfaces on the Final CTA gradient system. Remove inconsistent shadows, borders, and one-off gradient implementations.

---

## Canonical Token Stack

Defined in `src/styles/caretip-premium-visual.css` and mirrored in `src/lib/premiumVisualTokens.ts`:

| Token | Value / purpose |
|-------|-----------------|
| `--caretip-premium-bg` | `#100e0b` — anchor |
| `--caretip-premium-gradient` | Vertical warm band (Final CTA) |
| `--caretip-premium-gradient-dark` | Dark mode variant |
| `--caretip-premium-glow` | Radial orange atmosphere |
| `--caretip-premium-glow-mobile` | Simplified mobile atmosphere |
| `--caretip-premium-border` | `rgba(233, 120, 28, 0.28)` |
| `--caretip-premium-shadow` | Depth + orange lift |
| `--caretip-premium-cta-gradient` | Button fill `#ff9e2d → #d96f18` |

Extended in `src/styles/caretip-hero-personality.css`:

| Token | Purpose |
|-------|---------|
| `--caretip-premium-border-subtle/soft/defined` | Tiered border opacity |
| `--caretip-premium-elevation-depth/glow/inner` | Layered box-shadow |
| `--caretip-premium-glass-bg` | Translucent metric cells |

---

## Component Audit

| Component | Gradient | Elevation | Border | Status |
|-----------|----------|-----------|--------|--------|
| `PremiumPageHero` | CTA foundation | Personality-aware | Subtle amber | ✅ Standard |
| `BusinessModuleWorkspaceHeader` | Shared backdrop | 3-layer shadow | Subtle | ✅ Standard |
| `PremiumSummaryCard` | Shared backdrop | 3-layer shadow | Subtle | ✅ Standard |
| `PremiumPlanCard` | Shared backdrop | 3-layer shadow | Subtle | ✅ Standard |
| `CaretipPremiumBackdrop` | Base + atmosphere | N/A | N/A | ✅ Standard |
| `DashboardHero` (overview) | Light surface + warm edge | Inset highlight | Amber 4% | ✅ Standard |
| `businessUi.cardStatic` | White card | Soft neutral | Border token | ✅ Light surfaces |
| `premium-glass-surface` | Glass on light/dark | Inner only | Glass border | ✅ Executive cards |

---

## Inconsistencies Found & Resolved

### Before audit

| Issue | Location | Problem |
|-------|----------|---------|
| Duplicate shadow definitions | Various cards | Ad-hoc `shadow-lg` on premium heroes |
| Mixed gradient sources | Legacy `PREMIUM_GRADIENT` | Deprecated alias still referenced |
| QR Studio border | Workspace header | Needed stronger creative edge |
| Overview hero | Business dashboard | Competed visually with module heroes |
| Mobile atmosphere | All personalities | Heavy multi-radial on small screens |

### Standardization applied

1. **Unified elevation** — `.premium-workspace-header`, `.premium-summary-card`, `.premium-plan-card`, `.premium-page-hero[data-hero-personality]` share:
   ```css
   box-shadow: depth + glow + inner;
   border: 1px solid var(--caretip-premium-border-subtle);
   ```

2. **QR Studio accent** — Stronger border + orange glow ring (creative studio identity without new gradient).

3. **Overview hero** — Light-surface shadow stack (does not compete with dark module heroes).

4. **Mobile simplification** — Personalities use `--caretip-premium-glow-mobile` below 1024px.

5. **Deprecated tokens** — `PREMIUM_GRADIENT` / `PREMIUM_GLOW` in TS marked `@deprecated`; CSS vars are canonical.

---

## Glow & Border Rules

### Do use
- `--caretip-premium-elevation-glow` for warm orange lift on dark surfaces
- `--caretip-premium-border-subtle` for default premium cards
- `--caretip-premium-border-soft` for QR Studio and analytics KPI cells
- `inset 0 1px 0 rgba(255,255,255,0.07)` for top highlight

### Do not use
- Raw `box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)` on premium heroes
- Blue or green accent glows on business module headers
- `border-primary` at full opacity on large hero surfaces
- Multiple competing gradients in one component

---

## Final CTA → Dashboard Mapping

| Final CTA element | Dashboard equivalent |
|-------------------|---------------------|
| Section background gradient | `--caretip-premium-gradient` on backdrop |
| Radial orange atmosphere | `--caretip-premium-glow` + personality overlay |
| CTA button gradient | `--caretip-premium-cta-gradient` |
| Button glow | `--caretip-premium-cta-shadow` |
| Subtle top highlight | `--caretip-premium-elevation-inner` |

---

## Files to Modify for Premium Changes

| Change type | Primary files |
|-------------|---------------|
| New token | `caretip-premium-visual.css`, `premiumVisualTokens.ts` |
| Hero elevation | `caretip-hero-personality.css` |
| Personality atmosphere | `caretip-hero-personality.css` |
| Component structure | `BusinessModuleWorkspaceHeader.tsx`, `PremiumPageHero.tsx` |

---

## Compliance Checklist

```text
[ ] Hero uses CaretipPremiumBackdrop (not inline gradient)
[ ] Shadows use elevation tokens (not arbitrary Tailwind shadow-*)
[ ] Borders use --caretip-premium-border-* scale
[ ] CTA buttons use .caretip-premium-cta-button
[ ] Light-surface cards use businessUi.cardStatic or premium-glass-surface
[ ] personality prop set on every module workspace header
```

---

## Remaining Gaps (P2)

- Platform admin could use dedicated `platform` personality (currently `overview`)
- Some legacy marketing components outside dashboard still use pre-premium shadows
- Dark mode parity audit for all glass surfaces on light dashboard backgrounds

---

*Premium is one system. Personality is atmosphere on top.*
