import { ShieldCheck, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OfficialSourceSection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 bg-background overflow-hidden">
      <div className="gov-container">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 bg-stone-100 dark:bg-[#1C1B19] text-primary border border-stone-200 dark:border-[#2E2D2A] rounded-md flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            {t('home.official.badge')}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-navy mb-4">{t('home.official.title')}</h2>
          <p className="text-base md:text-lg text-muted-foreground mb-12">
            {t('home.official.desc')}
          </p>

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="px-6 py-4 bg-surface border border-border rounded-md w-full max-w-sm text-center">
              <span className="font-bold text-navy">GovGuide Platform</span>
              <p className="text-xs text-muted-foreground mt-0.5">{t('home.howItWorks.step2.title')}</p>
            </div>
            
            <div className="text-muted-foreground flex flex-col items-center">
              <div className="w-px h-8 bg-border border-dashed" />
              <ArrowDown className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="px-6 py-4 bg-surface border-2 border-primary/40 rounded-md w-full max-w-sm text-center">
              <span className="font-bold text-primary flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                {t('common.officialSource')}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">{t('home.official.bullet2')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
