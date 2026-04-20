import { GoogleLogin } from "@react-oauth/google";
import { cn } from "@/lib/utils";
import type { AuthRole } from "@/components/ui/sign-in-card-2";

type AuthOAuthButtonsProps = {
  isLogin: boolean;
  role: AuthRole;
  formBusy: boolean;
  name: string;
  businessName: string;
  inviteCode: string;
  onGoogleCredential: (idToken: string) => void;
};

/**
 * Google OAuth only (ID token → POST /api/auth/oauth).
 * Styled for light auth card.
 */
export function AuthOAuthButtons({
  isLogin,
  role,
  formBusy,
  name,
  businessName,
  inviteCode,
  onGoogleCredential,
}: AuthOAuthButtonsProps) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const canOAuthSignUp =
    isLogin ||
    (role === "business" && businessName.trim().length > 0 && name.trim().length > 0) ||
    (role === "employee" && inviteCode.trim().length > 0 && name.trim().length > 0);

  if (!googleClientId?.trim()) {
    return (
      <p className="text-center text-[11px] text-[#6B7280]">
        Add <code className="rounded bg-[#F3F4F6] px-1 text-[#1F2937]">VITE_GOOGLE_CLIENT_ID</code> to enable Google.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full justify-center [&>div]:!w-full",
        !isLogin && !canOAuthSignUp && "pointer-events-none opacity-40",
      )}
      title={
        !isLogin && !canOAuthSignUp
          ? "Enter your name and business or invite details first"
          : undefined
      }
    >
      <GoogleLogin
        onSuccess={(cred) => {
          if (cred.credential) onGoogleCredential(cred.credential);
        }}
        onError={() => {
          /* cancelled — optional toast elsewhere */
        }}
        useOneTap={false}
        theme="outline"
        size="large"
        width={320}
        text={isLogin ? "continue_with" : "signup_with"}
        shape="rectangular"
      />
    </div>
  );
}
