import React from "react";
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import AnimatedShaderBackground from '../components/ui/animated-shader-background';

export function TermsPage() {
  return (
    <div className="min-h-screen relative">
      <AnimatedShaderBackground />
      <div className="relative z-10">
        <Navigation />

        <main className="min-h-[70vh] px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </Link>

            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
                  Terms of Service
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground">
                  These terms govern your use of Caretip’s digital tipping platform for hospitality businesses, employees, and guests.
                </p>
              </div>

              <div className="pt-8">
                <div className="p-8 rounded-2xl bg-card border border-border space-y-6">
                  <div className="space-y-6 text-muted-foreground">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                      <p>
                        By accessing or using Caretip (“we,” “us,” or “the Service”), you agree to these Terms. If you do not agree, do not use the Service. Caretip enables businesses to offer QR-based digital tipping, process payments, and route tips to employees according to your agreement, fee tier, and settings.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">2. Eligibility and Accounts</h2>
                      <p className="mb-3">You may use Caretip only if you can form a binding contract. When you register:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>You must provide accurate information for yourself or your business</li>
                        <li>You are responsible for safeguarding your password and all activity under your account</li>
                        <li>You must notify us promptly of unauthorized access</li>
                        <li>Business accounts must only invite employees and issue QR codes in line with your workplace policies</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">3. The Service</h2>
                      <p className="mb-3">Caretip provides tools to:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Generate and manage QR codes and tipping flows for staff or locations</li>
                        <li>Allow guests to leave tips using supported payment methods</li>
                        <li>Display tips, payouts, and related notifications to authorized users</li>
                        <li>Provide analytics and reporting to businesses as described in your plan</li>
                      </ul>
                      <p className="mt-3">Features may vary by fee tier or account type. We may modify or discontinue features with reasonable notice where required by law.</p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">4. Fees, Tips, and Payments</h2>
                      <p className="mb-3">Digital tips are processed through payment partners. You agree that:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Platform or transaction fees may apply as shown at checkout or in your business agreement</li>
                        <li>Payout timing and methods depend on your configuration, verification status, and third-party rules</li>
                        <li>You are responsible for taxes, reporting, and compliance related to tips and wages in your jurisdiction</li>
                        <li>Chargebacks and payment disputes may be handled according to card network rules and our policies</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">5. Acceptable Use</h2>
                      <p className="mb-3">You must not:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Use the Service for fraud, money laundering, or illegal activity</li>
                        <li>Interfere with or disrupt the Service or other users</li>
                        <li>Attempt to access data or accounts you are not authorized to use</li>
                        <li>Misrepresent tips, identities, or business relationships</li>
                        <li>Reverse engineer or scrape the Service except where permitted by law</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">6. Intellectual Property</h2>
                      <p>
                        Caretip’s name, logo, software, and content are protected by intellectual property laws. We grant you a limited, non-exclusive license to use the Service as intended. You may not copy our materials except as allowed for normal use of the product.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">7. Third-Party Services</h2>
                      <p>
                        We integrate with payment processors, banks, and other providers. Your use of those services may be subject to their terms. We are not responsible for third-party outages or actions outside our reasonable control.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">8. Disclaimer and Limitation of Liability</h2>
                      <p>
                        The Service is provided “as available.” To the fullest extent permitted by law, Caretip is not liable for indirect, incidental, special, or consequential damages, or lost profits, arising from your use of tipping or payout features. Some jurisdictions do not allow certain limitations; in those cases, our liability is limited to the maximum allowed by law.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">9. Suspension and Termination</h2>
                      <p>
                        We may suspend or terminate access for breach of these Terms, risk to the platform, or legal requirements. You may close your account according to in-product options. Certain provisions survive termination.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">10. Changes to Terms</h2>
                      <p>
                        We may update these Terms. We will post changes here and update the “Last updated” date. Continued use after changes constitutes acceptance where permitted by law.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">11. Governing Law</h2>
                      <p>
                        These Terms are governed by the laws applicable in the United States, without regard to conflict-of-law rules, unless otherwise required by your jurisdiction.
                      </p>
                    </div>

                    <div className="pt-6 border-t border-border">
                      <p className="text-sm">
                        <strong>Last Updated:</strong> March 24, 2026
                      </p>
                      <p className="text-sm mt-3">
                        Questions? Contact us at legal@caretip.com
                      </p>
                    </div>
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
