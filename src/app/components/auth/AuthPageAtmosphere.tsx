/**
 * Calm ambient canvas for auth flows — static warmth, no flashy motion.
 */
export function AuthPageAtmosphere() {
  return (
    <div className="caretip-auth-atmosphere pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="caretip-auth-atmosphere__base" />
      <div className="caretip-auth-atmosphere__warm-top" />
      <div className="caretip-auth-atmosphere__warm-bottom" />
      <div className="caretip-auth-atmosphere__grain" />
    </div>
  );
}
