const BOOTSTRAP_ID = "app-bootstrap-loader";

/** Remove the static HTML first-paint loader once React shows the app overlay. */
export function hideAppBootstrapLoader(): void {
  if (typeof document === "undefined") return;
  document.getElementById(BOOTSTRAP_ID)?.remove();
  document.documentElement.classList.remove("app-bootstrap-active");
}
