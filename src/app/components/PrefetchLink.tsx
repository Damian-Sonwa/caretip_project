import { Link, type LinkProps } from "react-router";
import { prefetchAuthenticatedRoute } from "../lib/prefetchAuthenticatedRoutes";
import { prefetchCustomerFlowRoute } from "../lib/prefetchCustomerRoutes";
import { prefetchPublicRoute } from "../lib/prefetchPublicRoutes";

type PrefetchLinkProps = LinkProps;

function routePathFromTo(to: LinkProps["to"]): string {
  if (typeof to === "string") return to.split("#")[0].split("?")[0];
  if (to && typeof to === "object" && "pathname" in to && to.pathname) {
    return String(to.pathname);
  }
  return "";
}

function warmRoute(path: string): void {
  if (!path.startsWith("/")) return;
  prefetchPublicRoute(path);
  prefetchAuthenticatedRoute(path);
  prefetchCustomerFlowRoute(path);
}

export function PrefetchLink({ to, onMouseEnter, onFocus, onTouchStart, ...rest }: PrefetchLinkProps) {
  const warm = () => {
    warmRoute(routePathFromTo(to));
  };

  return (
    <Link
      to={to}
      onMouseEnter={(e) => {
        warm();
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        warm();
        onFocus?.(e);
      }}
      onTouchStart={(e) => {
        warm();
        onTouchStart?.(e);
      }}
      {...rest}
    />
  );
}
