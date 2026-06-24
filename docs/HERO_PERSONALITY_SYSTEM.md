# CareTip Hero Personality System

**Generated:** 2026-06-24  
**Purpose:** Give each major dashboard section a distinct identity while sharing one premium design family.

---

## Design Principle

> Same gradient foundation. Same elevation system. Same typography scale. **Different atmosphere.**

Users should know where they are within one second — by color mood, radial accent placement, and section label — without breaking brand cohesion.

**Source of truth:** Final CTA gradient (`--caretip-premium-gradient`) from `src/styles/caretip-premium-visual.css`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  --caretip-premium-gradient (shared vertical band)      │
├─────────────────────────────────────────────────────────┤
│  CaretipPremiumBackdrop                                 │
│    └── atmosphere overlay per personality               │
├─────────────────────────────────────────────────────────┤
│  Content hierarchy                                      │
│    section label → title → purpose → actions            │
└─────────────────────────────────────────────────────────┘
```

### Code map

| Layer | File | Role |
|-------|------|------|
| Personality registry | `src/lib/heroPersonalitySystem.ts` | IDs, metadata, data attributes |
| Atmosphere CSS | `src/styles/caretip-hero-personality.css` | Per-personality radial accents |
| Backdrop | `src/app/components/premium/CaretipPremiumBackdrop.tsx` | Applies atmosphere class |
| Module hero | `src/app/components/business/BusinessModuleWorkspaceHeader.tsx` | Workspace sections |
| Overview hero | `src/app/components/premium/PremiumPageHero.tsx` | Business + admin overview |
| Summary banner | `src/app/components/premium/PremiumSummaryCard.tsx` | Analytics / performance KPIs |

### Activation

```tsx
<BusinessModuleWorkspaceHeader personality="analytics" ... />
// Renders: data-hero-personality="analytics"
// Backdrop: .caretip-premium-backdrop__atmosphere--analytics
```

---

## Personality Catalog

| ID | Theme | Mood | Accent | Used on |
|----|-------|------|--------|---------|
| `overview` | Command Center | Welcoming operational hub | Warm amber lift | Business Dashboard, Admin |
| `analytics` | Business Intelligence | Data-driven reporting | Amber + champagne gold | Tips → Analytics, `PremiumSummaryCard` |
| `performance` | Decision Making | Executive command | Gold + amber spotlight | Team → Performance, health card |
| `tips` | Revenue & Activity | Energetic, live | Amber + gold | Tips module (live, transactions) |
| `qrStudio` | Creativity & Branding | Premium studio | Orange spotlight | QR Studio layout |
| `billing` | Growth & Subscription | Premium account | Gold + warm white | Billing layout |
| `team` | People & Performance | Leadership | Amber + soft orange | Top performers |
| `employees` | Workforce Management | Professional | Amber + muted orange | Team → Employees |
| `locations` | Operations | Structured | Subtle amber | Locations page |
| `notifications` | Activity & Awareness | Live ops center | Soft amber | Notification inbox |
| `customers` | Guest Voice | Thoughtful | Amber + rose tint | Customer feedback module |

---

## Shared Systems (unchanged across personalities)

### Gradient
```css
--caretip-premium-gradient: linear-gradient(180deg, #1e1813 0%, ... #100e0b 100%);
```

### Elevation
```css
--caretip-premium-elevation-depth
--caretip-premium-elevation-glow
--caretip-premium-elevation-inner
```

### Typography hierarchy
| Level | Class | Size (mobile → desktop) |
|-------|-------|---------------------------|
| Section label | `.premium-workspace-header__section-label` | 10px → 11px, uppercase |
| Title | `.premium-workspace-header__title` | 1.5rem → 2rem clamp |
| Purpose | `.premium-workspace-header__purpose` | 13px → 15px |
| KPI label | `.premium-summary-card__metric-label` | 12px uppercase |
| KPI value | `.premium-summary-card__metric-value` | clamp 1.25–1.625rem mobile |

### Glass surfaces
`.premium-glass-surface` — analytics executive cards, performance summary on light backgrounds.

---

## Personality-Specific Atmosphere

Each personality overrides **only** the radial accent layer on top of `--caretip-premium-glow`:

| Personality | Distinctive accent |
|-------------|-------------------|
| `qrStudio` | Strongest orange spotlight (studio creative energy) |
| `analytics` | Champagne gold upper-right bias |
| `performance` | Centered gold executive spotlight |
| `billing` | Warm white + gold (premium account) |
| `tips` | Top-centered energetic amber |
| `notifications` | Soft balanced amber (alert awareness) |
| `overview` | Minimal — light surface hero on dashboard |

On mobile (≤1023px), atmospheres simplify to a single optimized radial (`--caretip-premium-glow-mobile`) for performance and consistency.

---

## Route → Personality Mapping

| Route | Personality | Component |
|-------|-------------|-----------|
| `/dashboard` | `overview` | `PremiumPageHero` |
| `/dashboard/tips/analytics` | `analytics` | `BusinessTipsLayout` header |
| `/dashboard/tips/live` | `tips` | `BusinessTipsLayout` header |
| `/dashboard/team/performance` | `performance` | `BusinessTeamLayout` header |
| `/dashboard/team/employees` | `employees` | `BusinessTeamLayout` header |
| `/dashboard/team/top-performers` | `team` | `BusinessTeamLayout` header |
| `/dashboard/qr-studio/*` | `qrStudio` | `QrStudioLayout` header |
| `/dashboard/qr-studio/locations` | `locations` | `LocationsPage` header |
| `/dashboard/settings/billing` | `billing` | `BusinessBillingLayout` header |
| `/dashboard/notifications` | `notifications` | `NotificationInboxFeed` header |
| `/dashboard/customers/*` | `customers` | `BusinessCustomersLayout` header |
| `/admin` | `overview` | `PremiumPageHero` |

---

## Adding a New Personality

1. Add ID to `HERO_PERSONALITIES` in `heroPersonalitySystem.ts`
2. Add metadata to `HERO_PERSONALITY_META`
3. Add `.caretip-premium-backdrop__atmosphere--{id}` in `caretip-hero-personality.css`
4. Pass `personality="{id}"` to header or summary card
5. Include in mobile atmosphere simplification block if needed

---

## Do Not

- Create alternate base gradients per section
- Use different border-radius systems
- Mix non-premium shadows on workspace headers
- Add personality-specific font families

---

*Atmosphere differentiates. Foundation unifies.*
