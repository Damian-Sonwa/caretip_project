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
      { name: 'For Employees', to: '/#employee-section' },
      { name: 'Features', to: '/#features' },
      { name: 'How It Works', to: '/#how-it-works' },
      { name: 'Pricing', to: '/pricing' },
    ],
    Company: [
      { name: 'About Us', to: '/#about-section' },
      { name: 'Careers', to: '/careers' },
      { name: 'Blog', to: '/blog' },
      { name: 'Contact', to: '/contact' },
    ],
    Resources: [
      { name: 'Help Center', to: '/help' },
      { name: 'FAQs', to: '/faq' },
      { name: 'Privacy Policy', to: '/privacy' },
      { name: 'Terms', to: '/terms' },
    ],
  };

  /** Scroll to top for full-page routes (hash links rely on `ScrollToTop`). */
  const handleLinkClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <>
      {/* CTA Section Above Footer */}
      <section className="relative py-16 sm:py-24 px-6 overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-950 to-black"></div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white drop-shadow-sm">
            Ready for simpler
            <br />
            digital tipping?
          </h2>
          <p className="mx-auto max-w-2xl text-base text-white drop-shadow-sm sm:text-xl">
            QR tips for guests. Clear payouts for your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 sm:pt-4">
            <Link
              to="/signup"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary-hover sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
            </Link>
            <Link
              to="/#how-it-works"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-6 py-3 text-sm font-bold text-black shadow-md transition-all hover:bg-neutral-100 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              See How It Works
            </Link>
          </div>
          <p className="text-xs text-neutral-200 drop-shadow-sm sm:text-sm">
            No setup fees · Fast payouts · Secure payments
          </p>
        </div>
      </section>

      {/* Main Footer */}
      <footer className="border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-8 mb-12 sm:mb-16">
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

            {/* Column 5: Newsletter (Optional) */}
            <div className="lg:col-span-2 space-y-5">
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider">Stay Updated</h4>
              <p className="text-sm text-neutral-300">
                Product news in your inbox.
              </p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter email" 
                  className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-neutral-300 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
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