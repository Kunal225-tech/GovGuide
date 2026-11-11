import { UserCircle, Search, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: UserCircle,
      title: t('home.howItWorks.step1.title'),
      description: t('home.howItWorks.step1.desc'),
    },
    {
      icon: Search,
      title: t('home.howItWorks.step2.title'),
      description: t('home.howItWorks.step2.desc'),
    },
    {
      icon: FileText,
      title: t('home.howItWorks.step3.title'),
      description: t('home.howItWorks.step3.desc'),
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="gov-container">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            {t('home.howItWorks.badge')}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-navy">{t('home.howItWorks.title')}</h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">{t('home.howItWorks.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <Card key={index} className="bg-surface border-border rounded-md shadow-none hover:border-primary/50 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 font-extrabold text-5xl text-primary pointer-events-none group-hover:scale-110 transition-transform">
                0{index + 1}
              </div>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-stone-100 dark:bg-[#292826] border border-stone-200 dark:border-[#3A3834] rounded-md flex items-center justify-center mb-4 text-primary">
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
