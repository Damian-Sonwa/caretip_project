import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import AnimatedShaderBackground from './ui/animated-shader-background';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen relative">
      <AnimatedShaderBackground />
      <div className="relative z-10">
        <Navigation />
        
        <main className="min-h-[70vh] flex items-center justify-center px-6 py-20">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </Link>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
                {title}
              </h1>
              {description && (
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                  {description}
                </p>
              )}
            </div>

            <div className="pt-8">
              <div className="p-8 rounded-2xl bg-card border border-border">
                <p className="text-muted-foreground">
                  Content will be updated later
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
