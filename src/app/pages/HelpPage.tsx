import { Link } from 'react-router';
import { useMemo, useState } from 'react';
import { ArrowLeft, Search, Book, Video, MessageCircle, HelpCircle, CreditCard, Bell, Users, QrCode, Wallet } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import AnimatedShaderBackground from '../components/ui/animated-shader-background';

const helpCategories = [
  {
    title: "Getting Started",
    icon: Book,
    articles: [
      "Creating your business account",
      "Completing business verification",
      "Tour of the dashboard",
      "Setting up your first location",
    ],
  },
  {
    title: "QR codes & guests",
    icon: QrCode,
    articles: [
      "Generating QR codes for staff",
      "Printing and displaying codes",
      "What guests see when they scan",
      "Sharing a tip link without a QR code",
    ],
  },
  {
    title: "Tips & payments",
    icon: CreditCard,
    articles: [
      "How card payments are processed",
      "Fees and receipts for guests",
      "Refunds and disputes overview",
      "Supported payment methods",
    ],
  },
  {
    title: "Payouts & earnings",
    icon: Wallet,
    articles: [
      "Connecting a bank account",
      "Payout schedules and timing",
      "Employee profiles and roles",
      "Reading your earnings summary",
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    articles: [
      "Tip alerts for employees",
      "Email and push preferences",
      "Business reporting notifications",
      "Managing notification frequency",
    ],
  },
  {
    title: "Staff & locations",
    icon: Users,
    articles: [
      "Inviting and removing staff",
      "Roles and permissions",
      "Multiple locations and teams",
      "Exporting reports for accounting",
    ],
  },
  {
    title: "Troubleshooting",
    icon: HelpCircle,
    articles: [
      "Login and password issues",
      "QR code not scanning",
      "Guest payment declined",
      "Payout delays or failures",
    ],
  },
];

export function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return helpCategories;
    return helpCategories
      .map((cat) => {
        const titleMatch = cat.title.toLowerCase().includes(q);
        const articles = titleMatch
          ? cat.articles
          : cat.articles.filter((a) => a.toLowerCase().includes(q));
        return { ...cat, articles };
      })
      .filter((cat) => cat.articles.length > 0);
  }, [searchQuery]);

  return (
    <div className="min-h-screen relative">
      <AnimatedShaderBackground />
      <div className="relative z-10">
        <Navigation />
        
        <main className="min-h-[70vh] px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </Link>
            
            <div className="space-y-8">
              <div className="space-y-4 text-center">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
                  Help Center
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Find answers, guides, and resources to get the most out of Caretip.
                </p>
              </div>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto pt-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for help articles..."
                    autoComplete="off"
                    aria-label="Search help articles"
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
                <Link
                  to="/faq"
                  className="p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/20 transition-colors">
                    <HelpCircle className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Browse FAQs</h3>
                  <p className="text-sm text-muted-foreground">Quick answers to common questions</p>
                </Link>

                <div className="p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all text-center group cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/20 transition-colors">
                    <Video className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Video Tutorials</h3>
                  <p className="text-sm text-muted-foreground">Step-by-step video guides</p>
                </div>

                <Link
                  to="/contact"
                  className="p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/20 transition-colors">
                    <MessageCircle className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Contact Support</h3>
                  <p className="text-sm text-muted-foreground">Get help from our team</p>
                </Link>
              </div>

              {/* Help Categories */}
              <div className="pt-8">
                <h2 className="text-2xl font-semibold text-foreground mb-6">Browse by Category</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCategories.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                      No topics match your search. Try different keywords or{' '}
                      <button
                        type="button"
                        className="font-medium text-accent underline underline-offset-2"
                        onClick={() => setSearchQuery('')}
                      >
                        clear the search
                      </button>
                      .
                    </div>
                  ) : (
                    filteredCategories.map((category, index) => {
                    const Icon = category.icon;
                    return (
                      <div 
                        key={index}
                        className="p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-accent" />
                          </div>
                          <h3 className="font-semibold text-foreground">{category.title}</h3>
                        </div>
                        <ul className="space-y-2">
                          {category.articles.map((article, articleIndex) => (
                            <li key={articleIndex}>
                              <a 
                                href="#" 
                                className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-2 group"
                              >
                                <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-accent transition-colors"></span>
                                {article}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })
                  )}
                </div>
              </div>

              {/* Contact CTA */}
              <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 text-center">
                <h3 className="text-2xl font-semibold text-foreground mb-3">
                  Can't find what you're looking for?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our support team is here to help with tipping setup, payouts, and account questions.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-all"
                >
                  Contact Support
                  <MessageCircle className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
