import { Link } from "react-router";
import { SaasDashboard3DHero } from "../../components/saas-3d-hero";

/**
 * Standalone route to preview the premium 3D SaaS dashboard hero (R3F + Framer Motion).
 */
export default function SaasDashboard3DHeroPage() {
  return (
    <div className="min-h-screen bg-[#050814] text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050814]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm font-medium text-slate-300">3D dashboard hero</span>
          <Link
            to="/"
            className="text-sm font-medium text-violet-300 underline-offset-4 hover:text-violet-200 hover:underline"
          >
            Back home
          </Link>
        </div>
      </header>
      <SaasDashboard3DHero />
    </div>
  );
}
