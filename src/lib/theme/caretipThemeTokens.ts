/**
 * CareTip semantic theme tokens.
 *
 * Components should consume Tailwind utilities mapped in `theme.css`
 * (e.g. `bg-background`, `text-foreground`, `border-border`) — not raw colors.
 *
 * CSS custom properties are defined in `globals.css` under `:root` and `.dark`.
 */

/** CSS variable names (HSL components — use with `hsl(var(--token))`). */
export const caretipCssVars = {
  background: "--background",
  foreground: "--foreground",
  surface: "--card",
  surfaceSecondary: "--secondary",
  card: "--card",
  cardForeground: "--card-foreground",
  border: "--border",
  divider: "--border",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  primary: "--primary",
  primaryHover: "--primary-hover",
  primaryForeground: "--primary-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  success: "--success",
  successForeground: "--success-foreground",
  warning: "--warning",
  warningForeground: "--warning-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  input: "--input",
  inputBackground: "--input-background",
  ring: "--ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarBorder: "--sidebar-border",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
} as const;

/**
 * Tailwind semantic utility classes — preferred in TS token modules.
 * Paint mode is resolved via CSS variables; no `dark:` branch required.
 */
export const caretipThemeClasses = {
  background: "bg-background",
  foreground: "text-foreground",
  surface: "bg-card",
  surfaceSecondary: "bg-secondary",
  card: "bg-card border border-border shadow-sm",
  cardBorder: "border-border",
  textPrimary: "text-foreground",
  textSecondary: "text-muted-foreground",
  mutedText: "text-muted-foreground",
  primary: "bg-primary text-primary-foreground",
  primaryHover: "hover:bg-primary/90",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-destructive text-destructive-foreground",
  input: "border-input bg-input-background",
  divider: "border-border",
  sidebar: "bg-sidebar text-sidebar-foreground",
  header: "bg-background/95 border-border",
  focusRing: "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
} as const;
