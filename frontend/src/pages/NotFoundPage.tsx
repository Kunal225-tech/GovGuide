import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="gov-container py-24 text-center">
      <h1 className="text-4xl font-bold text-navy mb-4">{t('notFound.title')}</h1>
      <p className="text-muted-foreground mb-8">
        {t('notFound.desc')}
      </p>
      <Button asChild className="px-6 rounded-md shadow-none font-bold bg-primary hover:bg-primary-hover text-white transition-colors">
        <Link to="/">{t('notFound.backHome')}</Link>
      </Button>
    </div>
  );
}
