import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getSchemes } from '@/services/schemeApi';
import type { Scheme } from '@/types/scheme';
import { SaveButton } from '@/components/SaveButton';

export function FeaturedSchemes() {
  const { t, i18n } = useTranslation();
  const isHi = i18n.language === 'hi';
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getSchemes()
      .then((data) => {
        if (isMounted) {
          // Highlight prominent Bihar state schemes on the homepage
          const biharSchemes = data.filter((s) => s.state?.toLowerCase() === 'bihar');
          const displayList = biharSchemes.length >= 3 ? biharSchemes : data;
          setSchemes(displayList.slice(0, 3));
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-12 md:py-16 bg-surface border-y border-border">
      <div className="gov-container">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              {t('home.featured.badge')}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-2">{t('home.featured.title')}</h2>
            <p className="text-muted-foreground">{t('home.featured.subtitle')}</p>
          </div>
          <Button asChild variant="outline" className="hidden sm:flex items-center gap-2 text-navy border-border rounded-md">
            <Link to="/schemes">
              {t('home.featured.viewAll')} <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-md border border-border bg-card p-6 animate-pulse space-y-4">
                <div className="h-6 w-24 bg-muted rounded-md" />
                <div className="h-6 w-3/4 bg-muted rounded-md" />
                <div className="h-4 w-full bg-muted rounded-md" />
                <div className="h-4 w-5/6 bg-muted rounded-md" />
              </div>
            ))}
          </div>
        ) : schemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {schemes.map((scheme) => (
              <Card key={scheme._id} className="flex flex-col bg-card border-border/70 hover:border-primary/50 transition-colors h-full rounded-md shadow-none">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-800 dark:bg-[#292826] dark:text-[#F4F4F0] dark:border dark:border-[#3A3834]">
                        {scheme.category}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${
                        scheme.level === "central"
                          ? "bg-orange-50 text-orange-700 dark:bg-[#292826] dark:text-orange-300 dark:border dark:border-orange-900/40"
                          : "bg-emerald-50 text-emerald-700 dark:bg-[#292826] dark:text-emerald-300 dark:border dark:border-emerald-900/40"
                      }`}>
                        {scheme.level === "central" ? (isHi ? "केंद्रीय" : "Central") : (isHi ? "बिहार सरकार" : "Bihar State")}
                      </span>
                      {/* Special 7-Nischay Flagship Badge */}
                      {(scheme.name.toLowerCase().includes('student credit') || 
                        scheme.name.toLowerCase().includes('swayam sahayata') || 
                        scheme.name.toLowerCase().includes('kushal yuva') || 
                        scheme.aliases?.some(a => a.toLowerCase().includes('nischay') || a.toLowerCase().includes('nishchay')) ||
                        scheme.description.toLowerCase().includes('7-nischay') ||
                        scheme.description.toLowerCase().includes('saat nischay')) && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-[#292826] dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                          {isHi ? "⭐ 7 निश्चय" : "⭐ 7 Nischay"}
                        </span>
                      )}
                      {/* Medhasoft Badge */}
                      {(scheme.officialUrl?.includes('medhasoft') || 
                        scheme.name.toLowerCase().includes('kanya utthan') ||
                        scheme.name.toLowerCase().includes('protsahan')) && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-[#292826] dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                          {isHi ? "🎓 मेधासॉफ्ट" : "🎓 Medhasoft"}
                        </span>
                      )}
                    </div>
                    <SaveButton schemeId={scheme._id} schemeName={scheme.name} />
                  </div>
                  <CardTitle className="text-xl text-navy leading-tight line-clamp-2">
                    {scheme.name}
                  </CardTitle>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-[#A8A29E] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{isHi ? 'आवेदन: ऑनलाइन / RTPS / वसुधा केंद्र' : 'Mode: Online / RTPS / Vasudha Kendra'}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {scheme.description}
                  </p>
                </CardContent>
                <CardFooter className="pt-0 border-t border-border/50 mt-4 px-6 py-4">
                  <Link to={`/schemes/${scheme._id}`} className="text-primary text-sm font-bold flex items-center hover:underline w-full justify-between">
                    <span>{t('schemes.card.viewScheme')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{t('schemes.noResultsDesc')}</p>
            <Button asChild className="rounded-md bg-primary hover:bg-primary-hover text-white">
              <Link to="/schemes">{t('home.featured.viewAll')}</Link>
            </Button>
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Button asChild variant="outline" className="w-full text-navy border-border rounded-md">
            <Link to="/schemes">{t('home.featured.viewAll')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
