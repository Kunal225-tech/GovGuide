import { Landmark, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export function GovernmentLevelSection() {
  const { t } = useTranslation();

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="gov-container">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            {t('home.govLevel.badge')}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-navy">{t('home.govLevel.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('home.govLevel.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="bg-surface border-border overflow-hidden group hover:border-primary/50 transition-colors rounded-md shadow-none">
            <div className="h-1.5 bg-saffron" />
            <CardContent className="p-6 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-md bg-saffron/10 flex items-center justify-center mb-4">
                <Landmark className="w-8 h-8 text-saffron" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">{t('home.govLevel.central.title')}</h3>
              <p className="text-muted-foreground">
                {t('home.govLevel.central.desc')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border overflow-hidden group hover:border-green/50 transition-colors rounded-md shadow-none">
            <div className="h-1.5 bg-green" />
            <CardContent className="p-6 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-md bg-green/10 flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-green" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">{t('home.govLevel.state.title')}</h3>
              <p className="text-muted-foreground">
                {t('home.govLevel.state.desc')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
