import { AnimatePresence, motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router";
import { LogOut, QrCode, X } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { cn } from "@/lib/utils";
import { CareTipLogo, CARE_TIP_LOGO_SURFACE_CLASS } from "../CareTipLogo";
import { employeeDashboardNavItems, isEmployeeDashboardNavActive } from "./employeeDashboardNav";

type EmployeeMobileSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function EmployeeMobileSidebar({ isOpen, onClose }: EmployeeMobileSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />

          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:hidden"
          >
            <div className={cn("flex items-center justify-between px-6 py-4", CARE_TIP_LOGO_SURFACE_CLASS)}>
              <div className="flex min-w-0 flex-1 flex-col gap-1 pr-2">
                <div className="min-w-0">
                  <CareTipLogo size="sm" />
                </div>
                <span className="text-xs font-semibold text-sidebar-foreground">Employee</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-sidebar-accent"
              >
                <X className="h-5 w-5 text-sidebar-foreground" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              <ul className="space-y-1">
                {employeeDashboardNavItems.map((item) => {
                  const isActive = isEmployeeDashboardNavActive(item.href, location.pathname);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                          isActive
                            ? "bg-primary font-semibold text-primary-foreground shadow-md"
                            : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="px-4 pb-4">
              <Link
                to="/employee/dashboard?qr=1"
                onClick={onClose}
                className="mb-2 flex w-full items-center gap-3 rounded-lg border border-border bg-muted px-3 py-2.5 text-foreground"
              >
                <QrCode className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm font-semibold">My QR</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                  navigate("/login", { replace: true });
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Sign out</span>
              </button>
            </div>

            <div className="border-t border-sidebar-border p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{user?.name || "Team member"}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

