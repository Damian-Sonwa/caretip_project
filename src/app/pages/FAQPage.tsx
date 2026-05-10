import { Link, useSearchParams } from 'react-router';
import { ArrowLeft, Plus, Minus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import AnimatedShaderBackground from '../components/ui/animated-shader-background';
import { useEffect, useMemo, useState } from 'react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-card hover:bg-background transition-colors text-left"
      >
        <span className="font-semibold text-foreground">{question}</span>
        {isOpen ? (
          <Minus className="w-5 h-5 text-accent flex-shrink-0" />
        ) : (
          <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-background border-t border-border">
          <p className="text-muted-foreground">{answer}</p>
        </div>
      )}
    </div>
  );
}

const FAQ_ITEMS = [
    {
      question: "What is Caretip?",
      answer:
        "Caretip is a digital tipping platform for hospitality businesses. Guests scan a QR code, choose who to tip, and pay with a card or digital wallet. Businesses manage staff, QR codes, and reporting; employees see tips and earnings in their account.",
    },
    {
      question: "Do guests need to download an app to leave a tip?",
      answer:
        "No. Guests can tip from their phone browser using a QR code or link. No app download is required for the guest tipping flow.",
    },
    {
      question: "How do employees get paid?",
      answer:
        "Tips are processed through secure payment partners. Payout timing and methods depend on your business setup, verification, and payout settings. Employees should complete any required profile or payout information in the app.",
    },
    {
      question: "Is paying through Caretip secure?",
      answer:
        "Caretip uses industry-standard security practices and works with payment processors that meet PCI standards. Card data is handled by those partners; we do not store full card numbers on our servers.",
    },
    {
      question: "What does it cost my business?",
      answer:
        "Pricing depends on the CareTip fee tier you choose. Per-tip processing-style fees apply as shown on our Fees page or in your agreement. There are no hidden charges beyond what we disclose at signup or checkout.",
    },
    {
      question: "Can I use Caretip at multiple locations?",
      answer:
        "Yes. Higher business tiers support multiple locations and more advanced controls. You can manage staff and QR codes per location depending on your agreement.",
    },
    {
      question: "How do QR codes work for staff?",
      answer:
        "Each employee or role can have a QR code guests scan. Guests select an amount, tip, and optionally leave feedback. You can print or display codes digitally on tables, badges, or receipts.",
    },
    {
      question: "What if a guest disputes a charge?",
      answer:
        "Card networks and banks handle disputes according to their rules. We may share transaction details with processors to resolve issues. Contact support if you need help with a specific case.",
    },
    {
      question: "Do employees see tips in real time?",
      answer:
        "Caretip can notify employees when new tips arrive, depending on your settings and connectivity. Exact timing may vary by device and network.",
    },
    {
      question: "Can I export my data?",
      answer:
        "Business owners and authorized users may export reporting data where the product supports it. Contact support if you need a full data export for compliance.",
    },
    {
      question: "How do I get support?",
      answer:
        "Use the Help Center, FAQs, or contact form. We offer email support and aim to respond as quickly as possible during business hours.",
    },
    {
      question: "Do you offer a mobile app?",
      answer:
        "Caretip offers mobile experiences for employees and tools for businesses to manage tipping on the go. Availability may vary by platform; check the Mobile App page for details.",
    },
];

export function FAQPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = searchParams.get('q') ?? '';
  const [searchQuery, setSearchQuery] = useState(qFromUrl);

  useEffect(() => {
    setSearchQuery(qFromUrl);
  }, [qFromUrl]);

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FAQ_ITEMS;
    return FAQ_ITEMS.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    setOpenIndex(filteredFaqs.length > 0 ? 0 : null);
  }, [searchQuery, filteredFaqs.length]);

  const setQuery = (v: string) => {
    setSearchQuery(v);
    const t = v.trim();
    if (t) setSearchParams({ q: t }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

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
                  FAQs
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground">
                  Frequently asked questions about digital tipping with Caretip.
                </p>
              </div>

              <div className="relative max-w-xl pt-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('faq.searchPlaceholder')}
                  autoComplete="off"
                  aria-label={t('faq.searchAria')}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                />
              </div>

              <div className="pt-8">
                <div className="space-y-4">
                  {filteredFaqs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {t('faq.noMatch')}{' '}
                      <button
                        type="button"
                        className="font-medium text-accent underline underline-offset-2"
                        onClick={() => setQuery('')}
                      >
                        {t('faq.clearSearch')}
                      </button>
                    </p>
                  ) : (
                    filteredFaqs.map((faq, index) => (
                      <FAQItem
                        key={faq.question}
                        question={faq.question}
                        answer={faq.answer}
                        isOpen={openIndex === index}
                        onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                      />
                    ))
                  )}
                </div>

                {/* Contact CTA */}
                <div className="mt-12 p-8 rounded-2xl bg-accent/10 border border-accent/20 text-center">
                  <h3 className="text-2xl font-semibold text-foreground mb-3">
                    Still have questions?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Can't find the answer you're looking for? Our support team is here to help.
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-all"
                  >
                    Contact Support
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Link>
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
