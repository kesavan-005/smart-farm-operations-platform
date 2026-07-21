import { HelpCircle, Mail, BookOpen, ExternalLink, MessageCircle, ChevronRight, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HelpScreen() {
  const faqs = [
    {
      q: 'How does offline synchronization work?',
      a: 'The application automatically saves your changes locally when you have no internet connection. Once you are back online, it syncs those changes to the server seamlessly in the background.'
    },
    {
      q: 'Can I add multiple farms to my account?',
      a: 'Yes! You can add and manage as many farms as you need from the Farms dashboard. There is no hard limit on the number of fields or crops per farm.'
    },
    {
      q: 'How is the AI metadata generated?',
      a: 'The Smart Farm platform analyzes historical weather patterns, satellite imagery, and soil characteristics to suggest optimal recommendations. AI features will be fully activated in Phase 4.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sf-stagger">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Help & Support</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Find answers or reach out to our support team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* FAQ Section */}
          <div className="sf-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
              </div>
              Frequently Asked Questions
            </h3>
            
            <div className="space-y-5">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-border pb-5 last:border-0 last:pb-0">
                  <h4 className="text-sm font-semibold text-foreground mb-1.5 flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {faq.q}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-6">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Contact Support */}
          <div className="sf-card p-6 border-primary/20 bg-primary/[0.02] dark:bg-primary/5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Need More Help?</h3>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">Our support team is available Monday to Friday, 9am - 6pm.</p>
            
            <div className="space-y-3">
              <Button className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-sm">
                <MessageCircle className="w-4 h-4" /> Live Chat
              </Button>
              <Button variant="outline" className="w-full h-9 gap-2 text-sm border-border bg-background hover:bg-accent text-foreground">
                <Mail className="w-4 h-4" /> Email Support
              </Button>
            </div>
          </div>

          {/* About App */}
          <div className="sf-card p-6">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">About the Platform</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-xs">Version 1.0.0 (Phase 3C)</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Premium Release</p>
                </div>
              </div>
              
              <div className="pt-2 flex flex-col gap-2">
                <a href="#" className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors w-fit">
                  <BookOpen className="w-3.5 h-3.5" /> User Manual <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
                <a href="#" className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors w-fit">
                  <BookOpen className="w-3.5 h-3.5" /> Privacy Policy <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
