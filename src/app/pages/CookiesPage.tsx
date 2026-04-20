import React from "react";
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import AnimatedShaderBackground from '../components/ui/animated-shader-background';

export function CookiesPage() {
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
                  Cookie Policy
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground">
                  Learn how we use cookies.
                </p>
              </div>

              <div className="pt-8">
                <div className="p-8 rounded-2xl bg-card border border-border space-y-6">
                  <div className="space-y-6 text-muted-foreground">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">What Are Cookies?</h2>
                      <p>Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.</p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">Types of Cookies We Use</h2>
                      
                      <div className="space-y-4 mt-4">
                        <div className="p-4 rounded-lg bg-background border border-border">
                          <h3 className="text-lg font-semibold text-foreground mb-2">Essential Cookies</h3>
                          <p className="text-sm">These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.</p>
                          <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-sm">
                            <li>Authentication and login status</li>
                            <li>Security and fraud prevention</li>
                            <li>Session management</li>
                          </ul>
                        </div>

                        <div className="p-4 rounded-lg bg-background border border-border">
                          <h3 className="text-lg font-semibold text-foreground mb-2">Performance Cookies</h3>
                          <p className="text-sm">These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>
                          <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-sm">
                            <li>Page load times and performance</li>
                            <li>Error tracking and diagnostics</li>
                            <li>Usage statistics and analytics</li>
                          </ul>
                        </div>

                        <div className="p-4 rounded-lg bg-background border border-border">
                          <h3 className="text-lg font-semibold text-foreground mb-2">Functional Cookies</h3>
                          <p className="text-sm">These cookies enable the website to provide enhanced functionality and personalization.</p>
                          <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-sm">
                            <li>Remember your preferences and settings</li>
                            <li>Language and region selection</li>
                            <li>Customized user interface</li>
                          </ul>
                        </div>

                        <div className="p-4 rounded-lg bg-background border border-border">
                          <h3 className="text-lg font-semibold text-foreground mb-2">Targeting/Advertising Cookies</h3>
                          <p className="text-sm">These cookies are used to deliver advertisements more relevant to you and your interests.</p>
                          <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-sm">
                            <li>Track browsing behavior</li>
                            <li>Measure advertising effectiveness</li>
                            <li>Deliver personalized content</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">Third-Party Cookies</h2>
                      <p className="mb-3">We use services from trusted third-party providers that may set cookies on your device:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Google Analytics:</strong> To understand how users interact with our website</li>
                        <li><strong>Payment Processors:</strong> To securely process transactions</li>
                        <li><strong>Social Media Platforms:</strong> To enable social sharing features</li>
                        <li><strong>Customer Support Tools:</strong> To provide live chat and support</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">Managing Your Cookie Preferences</h2>
                      <p className="mb-3">You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or delete cookies through their settings</li>
                        <li><strong>Cookie Consent Tool:</strong> Use our cookie consent banner when you first visit our site</li>
                        <li><strong>Opt-Out Links:</strong> Follow opt-out instructions provided by third-party services</li>
                      </ul>
                      <p className="mt-3 text-sm italic">Note: Blocking essential cookies may affect the functionality of our website.</p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">How to Control Cookies in Your Browser</h2>
                      <div className="space-y-2">
                        <p><strong>Google Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</p>
                        <p><strong>Mozilla Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</p>
                        <p><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</p>
                        <p><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies</p>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">Cookie Retention</h2>
                      <p className="mb-3">Different cookies have different retention periods:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                        <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until you delete them</li>
                        <li><strong>Essential Cookies:</strong> Typically last for the duration of your session</li>
                        <li><strong>Analytics Cookies:</strong> Usually stored for up to 2 years</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-3">Updates to This Cookie Policy</h2>
                      <p>We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business operations. We encourage you to review this policy periodically.</p>
                    </div>

                    <div className="pt-6 border-t border-border">
                      <p className="text-sm">
                        <strong>Last Updated:</strong> March 18, 2026
                      </p>
                      <p className="text-sm mt-3">
                        If you have questions about our use of cookies, please contact us at privacy@caretip.com
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