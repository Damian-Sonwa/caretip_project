import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  ChevronDown,
  Mail,
  Send,
  Book,
  FileText,
  Video,
  MessageCircle,
  ExternalLink,
  Search,
  CheckCircle,
} from 'lucide-react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardMobileSidebar } from './DashboardMobileSidebar';
import { DashboardHeader } from './DashboardHeader';
import { Footer } from './Footer';
import AnimatedShaderBackground from './ui/animated-shader-background';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "How do I start accepting tips?",
    answer:
      "Create a CareTip business account, add your team, and print or display QR codes. Guests scan, pick an amount, and pay once with their card. Each charge is a single Stripe payment intent — not a subscription.",
    category: "Getting Started",
  },
  {
    id: 2,
    question: "What payment methods can guests use?",
    answer:
      "Guests typically pay with cards supported by Stripe (Visa, Mastercard, Amex, Discover, and wallets where enabled). You connect Stripe on the business side; CareTip does not store full card numbers.",
    category: "Payments",
  },
  {
    id: 3,
    question: "How do fees work?",
    answer:
      "CareTip charges transparent processing-style fees per successful tip (see the Fees page). There is no recurring software subscription on Starter — you only pay when a guest completes a tip.",
    category: "Pricing",
  },
  {
    id: 4,
    question: "Are tips recurring or one-time?",
    answer:
      "Every tip is one-time. We do not create Stripe subscriptions or send subscription invoices for guest tips.",
    category: "Account",
  },
  {
    id: 5,
    question: "What if a tip payment fails?",
    answer:
      "The guest can try again with another card. Failed attempts do not create recurring retries like a subscription — you’ll see the outcome in your tips and activity views.",
    category: "Tips",
  },
  {
    id: 6,
    question: "Is my data secure?",
    answer:
      "We use encryption in transit (HTTPS) and follow best practices for handling account data. Card processing is handled by Stripe; we do not store raw card data.",
    category: "Security",
  },
  {
    id: 7,
    question: "Can I export tip history?",
    answer:
      "Businesses can export tip and payout-related data from the dashboard where export is available (e.g. CSV from your reporting or transactions flows).",
    category: "Features",
  },
  {
    id: 8,
    question: "Do you offer APIs or webhooks?",
    answer:
      "Enterprise-style integrations may be available depending on your arrangement. Core CareTip is focused on QR tipping and staff profiles.",
    category: "Features",
  },
  {
    id: 9,
    question: "What support do you offer?",
    answer:
      "Email support is available for all customers; priority options may apply on higher tiers. We focus on helping you launch tipping quickly.",
    category: "Support",
  },
  {
    id: 10,
    question: "How do staff get their tips?",
    answer:
      "Payout timing and rules depend on your Stripe Connect or payout setup. CareTip records each tip with amount, business, employee, and status so you can reconcile in one place.",
    category: "Payouts",
  },
];

const resourceLinks = [
  {
    title: 'Documentation',
    description: 'Comprehensive guides and API references',
    icon: Book,
    link: '#',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Video Tutorials',
    description: 'Step-by-step video walkthroughs',
    icon: Video,
    link: '#',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation',
    icon: FileText,
    link: '#',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Community Forum',
    description: 'Connect with other developers',
    icon: MessageCircle,
    link: '#',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
];

export function SupportPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(faqData.map(item => item.category)))];

  // Filter FAQs
  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send form data to backend
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedShaderBackground />
      
      <div className="relative z-10">
        {/* Sidebar - Desktop */}
        <DashboardSidebar />

        {/* Sidebar - Mobile */}
        <DashboardMobileSidebar 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
        />

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Header */}
          <DashboardHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

          {/* Page Content */}
          <main className="px-4 lg:px-8 py-8 pb-20">
            {/* Page Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 mb-6"
              >
                <HelpCircle className="w-8 h-8 text-accent" />
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl sm:text-4xl font-semibold text-foreground mb-3"
              >
                How can we help you?
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-muted-foreground max-w-2xl mx-auto"
              >
                Search our knowledge base, browse FAQs, or get in touch with our support team
              </motion.p>
            </div>

            {/* Quick Resources */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
            >
              {resourceLinks.map((resource, index) => {
                const Icon = resource.icon;
                return (
                  <motion.a
                    key={resource.title}
                    href={resource.link}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all group"
                  >
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${resource.bgColor} mb-4`}>
                      <Icon className={`w-6 h-6 ${resource.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                      {resource.title}
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {resource.description}
                    </p>
                  </motion.a>
                );
              })}
            </motion.div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* FAQ Section */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-card border border-border rounded-xl p-6 sm:p-8 mb-6"
                >
                  <h2 className="text-2xl font-semibold text-foreground mb-6">
                    Frequently Asked Questions
                  </h2>

                  {/* Search and Filter */}
                  <div className="mb-6 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search FAQs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Category Pills */}
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedCategory === category
                              ? 'bg-accent text-white shadow-md'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {category === 'all' ? 'All' : category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FAQ Items */}
                  <div className="space-y-3">
                    {filteredFAQs.length > 0 ? (
                      filteredFAQs.map((faq, index) => (
                        <motion.div
                          key={faq.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border border-border rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleFAQ(faq.id)}
                            className="w-full flex items-center justify-between gap-4 p-5 bg-card hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="flex-1">
                              <span className="text-xs font-medium text-accent mb-1 block">
                                {faq.category}
                              </span>
                              <span className="text-sm sm:text-base font-medium text-foreground">
                                {faq.question}
                              </span>
                            </div>
                            <motion.div
                              animate={{ rotate: openFAQ === faq.id ? 180 : 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            </motion.div>
                          </button>
                          <AnimatePresence>
                            {openFAQ === faq.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="p-5 pt-0 text-sm text-muted-foreground border-t border-border bg-muted/30">
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">
                          No FAQs found matching your search.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Contact Form Sidebar */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-card border border-border rounded-xl p-6 sticky top-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Mail className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Contact Us
                    </h3>
                  </div>

                  {formSubmitted ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        Message Sent!
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        We'll get back to you within 24 hours.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Schmidt Paul"
                          className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="you@example.com"
                          className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="How can we help?"
                          className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Message
                        </label>
                        <textarea
                          required
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Tell us more about your question..."
                          rows={5}
                          className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium shadow-lg shadow-accent/20 transition-all"
                      >
                        <Send className="w-4 h-4" />
                        Send Message
                      </motion.button>
                    </form>
                  )}

                  {/* Chat Widget Placeholder */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent/80 hover:from-primary/90 hover:to-accent/70 text-white rounded-lg font-medium shadow-lg transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Start Live Chat
                    </motion.button>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Average response time: 2 minutes
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Additional Help Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="max-w-6xl mx-auto mt-12 bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-xl p-8 text-center"
            >
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Still need help?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Our support team is available 24/7 to assist you. Priority response times apply on higher CareTip fee tiers.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="mailto:support@caretip.com"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium shadow-lg shadow-accent/20 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  Email Support
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border bg-card hover:bg-muted rounded-lg font-medium transition-all"
                >
                  <Book className="w-4 h-4" />
                  View Documentation
                </a>
              </div>
            </motion.div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
