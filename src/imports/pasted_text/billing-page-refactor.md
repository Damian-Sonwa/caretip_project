Figma Prompt (Use Pricing Component + Dropdown UX for Billing)

Refactor the existing “Subscription & Billing” page without changing the design system (colors, typography, spacing).

Integrate a modern pricing section for subscription plans and use dropdown/accordion interactions for all other billing-related controls to keep the UI clean, minimal, and user-friendly.

🧱 Main Structure
1️⃣ Subscription Section (Use Pricing Component Style)

Replace the current plan UI with a modern pricing layout

Use:

3 plan cards (Starter, Pro, Enterprise)

Monthly ↔ Annual toggle

Highlight one “Popular” plan

Include:

Plan features list

Clear CTA buttons (“Upgrade”, “Start Trial”, etc.)

👉 This section should feel like a premium SaaS pricing experience, not basic cards

🔽 2️⃣ Billing & Settings (Use Dropdown / Accordion UI)

Instead of showing everything at once, organize into collapsible sections with dropdown arrows:

🔻 Payment Method (Dropdown)

Collapsed by default

When expanded:

Show saved card or “No payment method”

“Add / Update card” button

🔻 Billing Details (Dropdown)

Show:

Next billing date

Billing cycle (monthly/yearly)

Auto-renew status

🔻 Billing History (Dropdown)

Expand to show:

Simple list (date, plan, status)

“Download receipt” action

🔻 Plan Actions (Dropdown)

Actions like:

Cancel subscription

Pause subscription

Switch plan

🔗 How Everything Connects

Selecting a plan (top section) should:

Automatically reflect in billing details

Add helper text:

“Your subscription renews using your saved payment method”

Keep all interactions on one page

🎨 Design Instructions

Keep existing color palette (dark, premium, calm tones)

Use:

Rounded cards

Soft shadows

Clean spacing

Dropdown arrows should be:

Minimal (chevron icons)

Smooth animation on expand/collapse

⚙️ Interaction Behavior

Pricing toggle animates price change

Dropdowns expand smoothly (accordion style)

Keep UX light, not overwhelming

❌ Remove / Avoid

Tables always visible by default

Financial charts or analytics

Anything that looks like a payment dashboard such as Stripe

🎯 Final Goal

Create a page where:

Plans feel premium and interactive

Billing feels hidden but accessible

The UI is clean, modern, and not overwhelming