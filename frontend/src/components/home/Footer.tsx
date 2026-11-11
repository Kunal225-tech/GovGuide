import { Link } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border pt-16 pb-8">
      <div className="gov-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Landmark className="w-6 h-6 text-primary" strokeWidth={2.5} />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-navy leading-none">
                  GovGuide <span className="text-[#EA580C]">Bihar</span>
                </span>
                <span className="text-[11px] text-muted-foreground font-medium tracking-normal mt-0.5">
                  बिहार जन-कल्याण पोर्टल
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm">
              {t('footer.tagline')}
            </p>
            <div className="p-4 bg-background rounded-md border border-border text-xs text-muted-foreground max-w-sm mt-4">
              <strong>{t('footer.disclaimer')}</strong>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-navy mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/schemes" className="hover:text-primary transition-colors">{t('nav.schemes')}</Link></li>
              <li><Link to="/categories" className="hover:text-primary transition-colors">{t('nav.categories')}</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary transition-colors">{t('nav.howItWorks')}</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">{t('nav.about')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-navy mb-4">Bihar State Portals</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href="https://serviceonline.bihar.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  RTPS Bihar (ServicePlus) ↗
                </a>
              </li>
              <li>
                <a href="https://www.7nishchay-yuvaupmission.bihar.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  7 Nischay (MNSSBY / DRCC) ↗
                </a>
              </li>
              <li>
                <a href="https://medhasoft.bih.nic.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Medhasoft e-Kalyan ↗
                </a>
              </li>
              <li>
                <a href="https://dbtagriculture.bihar.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  DBT Agriculture Bihar ↗
                </a>
              </li>
              <li>
                <a href="https://udyami.bihar.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Udyami Bihar Portal ↗
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {year} {t('footer.rights')}</p>
          <div className="flex gap-6">
            <span className="text-muted-foreground">{t('common.officialSource')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
