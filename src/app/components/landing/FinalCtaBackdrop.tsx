import type { ReactNode } from "react";
import { CreditCard, QrCode, Smartphone, Wallet } from "lucide-react";
import { CaretipPremiumBackdrop } from "@/app/components/premium/CaretipPremiumBackdrop";
import { cn } from "@/lib/utils";

type FloatCardProps = {
  className?: string;
  children: ReactNode;
};

function FloatCard({ className, children }: FloatCardProps) {
  return (
    <div
      className={cn(
        "caretip-final-cta-float flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 backdrop-blur-md",
        "shadow-[0_8px_32px_rgba(0,0,0,0.28)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Decorative blurred UI fragments — atmosphere only, no interaction. */
export function FinalCtaBackdrop() {
  return (
    <div className="caretip-final-cta-scene pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <CaretipPremiumBackdrop />

      <FloatCard className="caretip-final-cta-float--qr left-[6%] top-[18%] hidden sm:flex lg:left-[10%]">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <QrCode className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="text-left">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-white/40">Scan</span>
          <span className="block text-xs font-semibold text-white/70">Table QR</span>
        </span>
      </FloatCard>

      <FloatCard className="caretip-final-cta-float--pay right-[5%] top-[22%] hidden md:flex lg:right-[9%]">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/55">
          <CreditCard className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="text-left">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-white/40">Pay</span>
          <span className="block text-xs font-semibold text-white/70">Apple Pay</span>
        </span>
      </FloatCard>

      <FloatCard className="caretip-final-cta-float--wallet left-[4%] bottom-[24%] hidden lg:flex lg:left-[7%]">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary/90">
          <Wallet className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="text-left">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-white/40">Payout</span>
          <span className="block text-xs font-semibold text-white/70">Instant</span>
        </span>
      </FloatCard>

      <FloatCard className="caretip-final-cta-float--mobile right-[4%] bottom-[20%] hidden lg:flex lg:right-[8%]">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/50">
          <Smartphone className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="text-left">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-white/40">Tip</span>
          <span className="block text-xs font-semibold text-white/70">In seconds</span>
        </span>
      </FloatCard>

      <div className="caretip-final-cta-orb caretip-final-cta-orb--a absolute left-[18%] top-[42%] h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      <div className="caretip-final-cta-orb caretip-final-cta-orb--b absolute right-[14%] top-[38%] h-40 w-40 rounded-full bg-[#F59E0B]/8 blur-3xl" />
    </div>
  );
}
