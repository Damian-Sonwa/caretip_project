import { Link } from 'react-router';
import { ArrowLeft, Mail, MessageSquare, Phone, MapPin } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import AnimatedShaderBackground from '../components/ui/animated-shader-background';

export function ContactPage() {
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
                  Contact Us
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground">
                  Have questions about Caretip? We're here to help.
                </p>
              </div>

              <div className="pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Contact Form */}
                  <div className="p-8 rounded-2xl bg-card border border-border">
                    <h2 className="text-2xl font-semibold text-foreground mb-6">Send us a message</h2>
                    <form className="space-y-5">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                          placeholder="Schmidt Paul"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                          placeholder="john@example.com"
                        />
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          id="subject"
                          className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                          placeholder="How can we help?"
                        />
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                          Message
                        </label>
                        <textarea
                          id="message"
                          rows={5}
                          className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none"
                          placeholder="Tell us more about your inquiry..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-all"
                      >
                        Send Message
                      </button>
                    </form>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-6">
                    <div className="p-8 rounded-2xl bg-card border border-border">
                      <h2 className="text-2xl font-semibold text-foreground mb-6">Get in touch</h2>
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Mail className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">Email</h3>
                            <p className="text-muted-foreground text-sm">support@caretip.com</p>
                            <p className="text-muted-foreground text-sm">sales@caretip.com</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                            <p className="text-muted-foreground text-sm">+1 (555) TIP-CARE</p>
                            <p className="text-muted-foreground text-sm">24/7 Support</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">Live Chat</h3>
                            <p className="text-muted-foreground text-sm">Available 24/7</p>
                            <button className="text-accent text-sm font-medium hover:underline mt-1">
                              Start a conversation
                            </button>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">Headquarters</h3>
                            <p className="text-muted-foreground text-sm">100 Hospitality Plaza</p>
                            <p className="text-muted-foreground text-sm">New York, NY 10013</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* FAQ Quick Link */}
                    <div className="p-6 rounded-2xl bg-accent/10 border border-accent/20">
                      <h3 className="font-semibold text-foreground mb-2">Looking for quick answers?</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Check out our FAQ section for instant answers to common questions.
                      </p>
                      <Link
                        to="/faq"
                        className="inline-flex items-center gap-2 text-accent font-medium text-sm hover:underline"
                      >
                        Visit FAQ
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </Link>
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