import React from "react";
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import AnimatedShaderBackground from '../components/ui/animated-shader-background';

export function PrivacyPage() {
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
                  Privacy Policy
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground">
                  Last updated: March 23, 2026
                </p>
                <p className="text-muted-foreground">
                  At Caretip, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our digital tipping platform.
                </p>
              </div>

              <div className="pt-8">
                <div className="p-8 rounded-2xl bg-card border border-border space-y-6">
                  <div className="space-y-6 text-muted-foreground">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
                      <p className="mb-3">We collect information you provide directly to us when you:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Create a business or employee account on Caretip</li>
                        <li>Process or receive digital tips through our platform</li>
                        <li>Link your bank account or payment method for payouts</li>
                        <li>Contact our support team or communicate with us</li>
                        <li>Participate in surveys, contests, or promotional activities</li>
                      </ul>
                      <p className="mt-3">This may include your name, email address, phone number, business information, payment information, and tip transaction details.</p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
                      <p className="mb-3">We use the information we collect to:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Process digital tips and facilitate instant payouts to employees</li>
                        <li>Provide, maintain, and improve our tipping platform</li>
                        <li>Generate QR codes and personalized tipping links</li>
                        <li>Send transaction confirmations and payout notifications</li>
                        <li>Provide analytics and insights to business owners</li>
                        <li>Respond to your comments, questions, and customer service requests</li>
                        <li>Prevent fraud and ensure platform security</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">3. Information Sharing and Disclosure</h2>
                      <p className="mb-3">We may share your information in the following situations:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>With your consent:</strong> We'll share your information when you explicitly consent</li>
                        <li><strong>Service providers:</strong> We work with third-party service providers who help us operate our platform</li>
                        <li><strong>Legal requirements:</strong> We may disclose information if required by law or legal process</li>
                        <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or asset sale</li>
                      </ul>
                      <p className="mt-3">We never sell your personal information to third parties.</p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">4. Data Security</h2>
                      <p>We implement industry-standard security measures to protect your personal information. This includes encryption, secure servers, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">5. Your Rights and Choices</h2>
                      <p className="mb-3">You have the right to:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Access, update, or delete your personal information</li>
                        <li>Opt-out of marketing communications</li>
                        <li>Request a copy of your data</li>
                        <li>Object to processing of your personal information</li>
                        <li>Close your account at any time</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">6. Cookies and Tracking Technologies</h2>
                      <p>We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. For more information, please see our Cookie Policy.</p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">7. Data Retention</h2>
                      <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.</p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">8. International Data Transfers</h2>
                      <p>Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ.</p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">9. Children's Privacy</h2>
                      <p>Our service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18.</p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">10. Changes to This Privacy Policy</h2>
                      <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
                    </div>

                    <div className="pt-6 border-t border-border">
                      <p className="text-sm">
                        <strong>Last Updated:</strong> March 23, 2026
                      </p>
                      <p className="text-sm mt-3">
                        If you have any questions about this Privacy Policy, please contact us at privacy@caretip.com
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