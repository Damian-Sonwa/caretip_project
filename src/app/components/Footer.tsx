import { ArrowRight, Twitter, Linkedin, Github, Globe } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

const APP_VERSION =
  typeof import.meta.env.VITE_APP_VERSION === 'string' && import.meta.env.VITE_APP_VERSION.trim() !== ''
    ? import.meta.env.VITE_APP_VERSION.trim()
    : null;

export function Footer({
  variant = 'default',
  surface = 'light',
}: {
  variant?: 'default' | 'minimal';
  /** Used with `variant="minimal"` for dark auth pages */
  surface?: 'light' | 'dark';
}) {
  if (variant === 'minimal') {
    const dark = surface === 'dark';
    return (
      <footer
        className={cn(
          'border-t py-6 px-4 mt-auto',
          dark
            ? 'border-white/10 bg-zinc-950/90 text-zinc-400'
            : 'border-border bg-card/30 text-muted-foreground'
        )}
      >
        <div className="max-w-7xl mx-auto text-center text-sm">
          <p>© {new Date().getFullYear()} Caretip. All rights reserved.</p>
          {APP_VERSION ? (
            <p className="text-xs mt-1 opacity-80">Version {APP_VERSION}</p>
          ) : (
            <p className="text-xs mt-1 opacity-80">Platform admin</p>
          )}
        </div>
      </footer>
    );
  }

  /** Landing sections: `Link` to `/#id` so `ScrollToTop` smooth-scrolls on route+hash changes. */
  const footerLinks = {
    Product: [
      { name: 'For Businesses', to: '/#business-section' },
      { name: 'For Employees', to: '/#for-employees' },
      { name: 'Features', to: '/features' },
      { name: 'How It Works', to: '/how-it-works' },
      { name: 'Pricing', to: '/pricing' },
    ],
    Company: [
      { name: 'About Us', to: '/#about-section' },
      { name: 'Contact', to: '/contact' },
    ],
    Resources: [
      { name: 'Help Center', to: '/help' },
      { name: 'FAQs', to: '/faq' },
      // Privacy/Terms are already linked in the bottom footer row.
    ],
  };

  /** Scroll to top for full-page routes (hash links rely on `ScrollToTop`). */
  const handleLinkClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <>
      {/* Main Footer */}
      <footer className="relative overflow-hidden border-t border-white/10">
        {/* Background with gradient (from the removed CTA section) */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950" />
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden />

        <div className="relative max-w-7xl mx-auto px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-8 sm:gap-12 lg:gap-8 mb-12 sm:mb-16">
            {/* Column 1: Brand */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-xl font-bold text-white">Caretip</h3>
              <p className="max-w-sm leading-relaxed text-neutral-300">
                Digital tipping for hospitality: QR codes, payouts, and team insight in one platform.
              </p>
              
              {/* Social Media Icons */}
              <div className="flex items-center gap-4 pt-2">
                <a 
                  href="#" 
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-neutral-300 transition-all hover:bg-white/10 hover:text-white"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-neutral-300 transition-all hover:bg-white/10 hover:text-white"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-neutral-300 transition-all hover:bg-white/10 hover:text-white"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="lg:col-span-2 space-y-5">
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3">
                {footerLinks.Product.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.to}
                      className="text-sm text-neutral-300 transition-colors hover:text-white inline-block"
                      onClick={link.to.startsWith('/#') ? undefined : handleLinkClick}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Company */}
            <div className="lg:col-span-2 space-y-5">
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3">
                {footerLinks.Company.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.to}
                      className="text-sm text-neutral-300 transition-colors hover:text-white inline-block"
                      onClick={link.to.startsWith('/#') ? undefined : handleLinkClick}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Resources */}
            <div className="lg:col-span-2 space-y-5">
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-3">
                {footerLinks.Resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.to}
                      className="text-sm text-neutral-300 transition-colors hover:text-white inline-block"
                      onClick={handleLinkClick}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col items-center gap-6 text-sm text-neutral-300 md:flex-row">
                <p>© 2026 Caretip. All rights reserved.</p>
                <div className="flex items-center gap-6">
                  <Link to="/privacy" className="transition-colors hover:text-white" onClick={handleLinkClick}>
                    Privacy
                  </Link>
                  <Link to="/terms" className="transition-colors hover:text-white" onClick={handleLinkClick}>
                    Terms
                  </Link>
                  <Link to="/cookies" className="transition-colors hover:text-white" onClick={handleLinkClick}>
                    Cookies
                  </Link>
                </div>
              </div>

              {/* Language/Region Selector */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-neutral-300 transition-all hover:bg-white/10 hover:text-white"
                >
                  <Globe className="w-4 h-4" />
                  <span>English (US)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}