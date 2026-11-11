import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export function FinalCTA() {
  const { t } = useTranslation();

  return (
    <section className="py-14 md:py-20 bg-stone-900 dark:bg-[#1C1B19] text-[#F4F4F0] border-t border-border">
      <div className="gov-container relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F4F4F0]">{t('home.cta.title')}</h2>
          <p className="text-base text-stone-300 max-w-2xl mx-auto leading-relaxed">
            {t('home.cta.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Button 
              asChild 
              size="lg" 
              className="w-full sm:w-auto bg-[#D95D39] hover:bg-[#C44D2B] text-white font-semibold px-7 h-11 rounded-md shadow-none"
            >
              <Link to="/eligible">{t('home.cta.btnPrimary')}</Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-stone-700 dark:border-[#2E2D2A] text-[#F4F4F0] hover:bg-stone-800 dark:hover:bg-[#292826] font-semibold px-7 h-11 rounded-md shadow-none"
            >
              <Link to="/schemes">{t('home.cta.btnSecondary')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
