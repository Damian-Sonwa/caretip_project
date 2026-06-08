import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { paymentLogoUrl, type PaymentMethodMarkId } from "./paymentLogoAssets";

export type { PaymentMethodMarkId } from "./paymentLogoAssets";

type MarkProps = {
  className?: string;
};

function PaymentLogoImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-full w-full object-contain object-center", className)}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}

/** Fallback when `/payment_logo` asset is missing. */
export function ApplePayMark({ className }: MarkProps) {
  return (
    <svg
      className={cn("h-full w-full", className)}
      viewBox="0 0 52 22"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Apple Pay"
    >
      <path
        fill="currentColor"
        d="M9.24 4.12c-.57.67-1.48 1.2-2.38 1.13-.11-.91.33-1.87.87-2.47.57-.67 1.58-1.14 2.39-1.18.1.95-.28 1.87-.88 2.52zm.87 1.4c-1.33-.08-2.46.76-3.1.76-.64 0-1.61-.72-2.65-.7-1.36.02-2.62.79-3.32 2.02-1.42 2.45-.36 6.09 1.02 8.1.68.98 1.47 2.08 2.53 2.04 1.01-.04 1.39-.65 2.61-.65 1.22 0 1.55.65 2.62.63 1.08-.02 1.77-.99 2.43-1.98.77-1.12 1.08-2.21 1.1-2.27-.02-.01-2.12-.81-2.14-3.21-.02-2.01 1.65-2.98 1.72-3.04-1.47-2.16-3.77-2.31-4.57-2.34z"
      />
      <path
        fill="currentColor"
        d="M17.1 6.1h1.87l1.16 3.19 1.16-3.19h1.85v7.8h-1.52V9.3l-1.26 3.48h-1.16l-1.26-3.51v4.63H17.1V6.1zm9.56 0h2.91c1.68 0 2.83 1.14 2.83 2.86 0 1.75-1.16 2.89-2.87 2.89h-1.31v2.08h-1.56V6.1zm1.56 1.33v3.05h1.23c.94 0 1.46-.5 1.46-1.53 0-1.02-.52-1.52-1.46-1.52h-1.23zm5.73-1.33h1.56v7.8h-1.56V6.1zm3.33 0h1.6l2.37 5.32V6.1h1.47v7.8h-1.56l-2.39-5.36v5.36h-1.5V6.1z"
      />
    </svg>
  );
}

export function GooglePayMark({ className }: MarkProps) {
  return (
    <svg
      className={cn("h-full w-full", className)}
      viewBox="0 0 66 26"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Google Pay"
    >
      <path
        d="M12.5 13.1V9.7h9.9c.1.8.2 1.7.2 2.7 0 1-.1 2-.4 2.9H12.5z"
        fill="#4285F4"
      />
      <path
        d="M22.4 13.1c0 .7-.1 1.4-.2 2.1H12.5v-3.4h9.9c.1.7.2 1.4.2 2.1z"
        fill="#34A853"
      />
      <path
        d="M17.4 18.4c2 0 3.7-.6 4.6-1.8l3.4 2.6c-2 1.8-4.6 2.9-8 2.9-4.4 0-8.1-2.9-9.4-6.9l4-3.1c.7 2 2.5 3.3 4.4 3.3z"
        fill="#FBBC05"
      />
      <path
        d="M7.9 11.5c-.2.7-.4 1.4-.4 2.1s.1 1.4.4 2.1L4 18.8C2.6 14.8 2.6 9.5 4 5.5l4 3.1z"
        fill="#EA4335"
      />
      <path
        d="M17.4 7.3c1.2 0 2.2.4 3 1.1l2.2-2.2C20.9 4.8 19.2 4 17.4 4 13 4 9.3 6.9 8 10.9l4 3.1c.7-1.9 2.5-3.3 4.4-3.3z"
        fill="#EA4335"
      />
      <path
        fill="#5F6368"
        d="M28.5 8.2h1.5v9.6h-1.5V8.2zm3.2 0h1.5l3.4 6.2V8.2h1.5v9.6h-1.5l-3.4-6.2v6.2h-1.5V8.2zm9.4 0c2 0 3.4 1.3 3.4 3.2v3.2c0 .2 0 .4.02.5h-5.3c.2.9.9 1.4 2 1.4.8 0 1.5-.3 1.9-.9l1 1.2c-.7.9-1.9 1.4-3.1 1.4-2.3 0-3.8-1.5-3.8-3.8 0-2.2 1.6-3.8 3.8-3.8zm1.9 2.6c-.1-.8-.7-1.3-1.7-1.3-.9 0-1.6.5-1.8 1.3h3.5zM50.6 8.2c1.1 0 2 .4 2.5 1.1V8.2h1.5v9.6h-1.5v-1.1c-.5.7-1.4 1.1-2.5 1.1-2 0-3.5-1.6-3.5-3.8 0-2.3 1.5-3.8 3.5-3.8zm.4 1.4c-1.2 0-2 .9-2 2.4s.8 2.4 2 2.4 2-.9 2-2.4-.8-2.4-2-2.4z"
      />
    </svg>
  );
}

export function CardPaymentMark({ className }: MarkProps) {
  return (
    <CreditCard
      className={cn("h-[70%] w-[70%] text-foreground/85", className)}
      strokeWidth={1.75}
      aria-hidden
    />
  );
}

const MARK_ALT: Record<PaymentMethodMarkId, string> = {
  "apple-pay": "Apple Pay",
  "google-pay": "Google Pay",
  card: "Credit or debit card",
};

export function PaymentMethodMark({
  id,
  className,
}: {
  id: PaymentMethodMarkId;
  className?: string;
}) {
  const src = paymentLogoUrl(id);
  if (src) {
    return <PaymentLogoImage src={src} alt={MARK_ALT[id]} className={className} />;
  }

  if (id === "apple-pay") {
    return <ApplePayMark className={cn("text-neutral-950 dark:text-neutral-50", className)} />;
  }
  if (id === "google-pay") {
    return <GooglePayMark className={className} />;
  }
  return <CardPaymentMark className={className} />;
}
