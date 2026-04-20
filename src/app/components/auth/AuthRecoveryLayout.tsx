import { Link } from "react-router";
import { CareTipLogo } from "@/app/components/CareTipLogo";

type AuthRecoveryLayoutProps = {
  children: React.ReactNode;
  /** Show subtle “Back to sign in” under the card (default true). */
  showFooterLink?: boolean;
};

/**
 * Soft light (alabaster) canvas + white elevated card + centered CareTip logo.
 */
export function AuthRecoveryLayout({ children, showFooterLink = true }: AuthRecoveryLayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] font-['Roboto',ui-sans-serif,system-ui,sans-serif]">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8 flex justify-center">
          <div className="rounded-xl border border-neutral-200/90 bg-white px-4 py-2 shadow-sm">
            <CareTipLogo size="auth" align="center" layoutIsolatedDouble />
          </div>
        </div>
        <div className="rounded-[24px] border border-neutral-100/80 bg-white p-6 shadow-2xl sm:p-8">
          {children}
        </div>
        {showFooterLink ? (
          <p className="mt-8 text-center text-xs text-[#6B7280]">
            <Link to="/login" className="font-medium text-[#EB992C] hover:underline">
              Back to sign in
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
