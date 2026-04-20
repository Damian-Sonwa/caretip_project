import { Link } from 'react-router';
import { ArrowLeft, UserPlus, QrCode, Smartphone, Wallet, Shield, Zap } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { AuthLikePageBackground } from '../components/AuthLikePageBackground';

export function HowItWorksPage() {
  return (
    <div className="relative min-h-[100dvh] bg-white">
      <AuthLikePageBackground />
      <div className="relative z-10 min-w-0">
        <Navigation />

        <main className="min-h-[70vh] min-w-0 px-6 pb-20 pt-24 sm:pt-28">
          <div className="mx-auto max-w-4xl">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>

            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl md:text-6xl">
                  How It Works
                </h1>
                <p className="text-lg text-neutral-600 sm:text-xl">
                  From signup to guest payment. Here's how Caretip powers digital tipping for your team.
                </p>
              </div>

              <div className="pt-8">
                <div className="space-y-12">
                  <div className="space-y-8">
                    <div className="flex items-start gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(33_82%_55%_/_0.12)]">
                        <UserPlus className="h-6 w-6 text-[hsl(33_82%_55%)]" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="rounded-full bg-[hsl(33_82%_55%_/_0.15)] px-3 py-1 text-xs font-semibold text-[hsl(33_82%_45%)]">
                            STEP 1
                          </span>
                          <h3 className="text-2xl font-semibold text-neutral-900">Create your business</h3>
                        </div>
                        <p className="mb-4 text-neutral-600">
                          Sign up as a business, add your locations, and invite managers or staff. Complete any verification steps so you can accept tips and run payouts according to your CareTip agreement and fee tier.
                        </p>
                        <div className="rounded-lg border border-neutral-200 bg-white/95 p-4 shadow-sm">
                          <p className="text-sm text-neutral-600">
                            <strong className="text-neutral-900">Tip:</strong> Add each location you operate so QR codes and reporting stay organized from day one.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(33_82%_55%_/_0.12)]">
                        <QrCode className="h-6 w-6 text-[hsl(33_82%_55%)]" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="rounded-full bg-[hsl(33_82%_55%_/_0.15)] px-3 py-1 text-xs font-semibold text-[hsl(33_82%_45%)]">
                            STEP 2
                          </span>
                          <h3 className="text-2xl font-semibold text-neutral-900">Issue QR codes for your team</h3>
                        </div>
                        <p className="mb-4 text-neutral-600">
                          Generate QR codes for individuals, roles, or shared team pools. Print table tents, add codes to name badges, or show them on receipts. Guests always land on a fast, mobile-friendly tipping page.
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-lg border border-neutral-200 bg-white/95 p-3 text-center shadow-sm">
                            <p className="mb-1 text-xs font-semibold text-neutral-900">Per person</p>
                            <p className="text-xs text-neutral-600">Direct to staff</p>
                          </div>
                          <div className="rounded-lg border border-neutral-200 bg-white/95 p-3 text-center shadow-sm">
                            <p className="mb-1 text-xs font-semibold text-neutral-900">Team pool</p>
                            <p className="text-xs text-neutral-600">Split fairly</p>
                          </div>
                          <div className="rounded-lg border border-neutral-200 bg-white/95 p-3 text-center shadow-sm">
                            <p className="mb-1 text-xs font-semibold text-neutral-900">Link share</p>
                            <p className="text-xs text-neutral-600">No print needed</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(33_82%_55%_/_0.12)]">
                        <Smartphone className="h-6 w-6 text-[hsl(33_82%_55%)]" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="rounded-full bg-[hsl(33_82%_55%_/_0.15)] px-3 py-1 text-xs font-semibold text-[hsl(33_82%_45%)]">
                            STEP 3
                          </span>
                          <h3 className="text-2xl font-semibold text-neutral-900">Guests scan, tip, and pay</h3>
                        </div>
                        <p className="mb-4 text-neutral-600">
                          Guests use their phone camera with no app install required. They pick an amount, pay with card or wallet, and can leave optional feedback. You get a clear record for the business and your team.
                        </p>
                        <div className="rounded-lg border border-neutral-200 bg-white/95 p-4 shadow-sm">
                          <p className="text-sm text-neutral-600">
                            <strong className="text-neutral-900">Guest-friendly:</strong> Works on common mobile browsers; receipts can be emailed when enabled.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(33_82%_55%_/_0.12)]">
                        <Wallet className="h-6 w-6 text-[hsl(33_82%_55%)]" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="rounded-full bg-[hsl(33_82%_55%_/_0.15)] px-3 py-1 text-xs font-semibold text-[hsl(33_82%_45%)]">
                            STEP 4
                          </span>
                          <h3 className="text-2xl font-semibold text-neutral-900">Notify, reconcile, and pay out</h3>
                        </div>
                        <p className="mb-4 text-neutral-600">
                          Employees can receive alerts when tips arrive. Owners and finance teams use reporting by location and date range. Payouts follow your processor and bank setup. See earnings in the dashboard when they settle.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg border border-neutral-200 bg-white/95 p-3 shadow-sm">
                            <p className="text-lg font-semibold text-[hsl(33_82%_55%)]">Live</p>
                            <p className="text-xs text-neutral-600">Tip notifications</p>
                          </div>
                          <div className="rounded-lg border border-neutral-200 bg-white/95 p-3 shadow-sm">
                            <p className="text-lg font-semibold text-[hsl(33_82%_55%)]">Clear</p>
                            <p className="text-xs text-neutral-600">Payout visibility</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-12">
                    <h2 className="mb-8 text-center text-3xl font-semibold text-neutral-900">
                      Trust and speed for every shift
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="rounded-xl border border-neutral-200 bg-white/95 p-6 shadow-sm">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(33_82%_55%_/_0.12)]">
                          <Shield className="h-6 w-6 text-[hsl(33_82%_55%)]" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-neutral-900">Payments you can stand behind</h3>
                        <p className="text-sm text-neutral-600">
                          Card data is handled by certified processors; connections use modern encryption so guest payments and business data stay protected end to end.
                        </p>
                      </div>

                      <div className="rounded-xl border border-neutral-200 bg-white/95 p-6 shadow-sm">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(33_82%_55%_/_0.12)]">
                          <Zap className="h-6 w-6 text-[hsl(33_82%_55%)]" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-neutral-900">Built for busy floors</h3>
                        <p className="text-sm text-neutral-600">
                          Web and mobile experiences stay in sync so managers and staff see updates whether they are on site or on the go.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-lg">
                    <h3 className="mb-3 text-2xl font-semibold text-neutral-900">
                      Ready to roll out digital tipping?
                    </h3>
                    <p className="mb-6 text-neutral-600">
                      See fee tiers built for hospitality teams, from single venues to multi-location groups.
                    </p>
                    <Link
                      to="/pricing"
                      className="inline-flex items-center gap-2 rounded-lg bg-[#EB992C] px-6 py-3 font-semibold text-white transition-colors hover:bg-[hsl(33_82%_48%)]"
                    >
                      View pricing
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
