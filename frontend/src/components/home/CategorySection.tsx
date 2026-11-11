import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Briefcase, 
  Wheat, 
  HeartPulse, 
  House, 
  Users, 
  Wallet, 
  ShieldCheck, 
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export function CategorySection() {
  const { t, i18n } = useTranslation();
  const isHi = i18n.language === 'hi';

  const categories = [
    { name: "Education", labelHi: "शिक्षा और छात्रवृत्ति", icon: GraduationCap, color: "text-amber-800 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-950/40" },
    { name: "Employment", labelHi: "रोजगार और आजीविका", icon: Briefcase, color: "text-stone-700 dark:text-stone-300", bg: "bg-stone-200 dark:bg-[#1C1B19]" },
    { name: "Agriculture", labelHi: "कृषि और किसान कल्याण", icon: Wheat, color: "text-green-600", bg: "bg-green-100" },
    { name: "Healthcare", labelHi: "स्वास्थ्य और चिकित्सा", icon: HeartPulse, color: "text-rose-600", bg: "bg-rose-100" },
    { name: "Housing", labelHi: "आवास एवं शहरी विकास", icon: House, color: "text-orange-600", bg: "bg-orange-100" },
    { name: "Women & Child", labelHi: "महिला एवं बाल कल्याण", icon: Users, color: "text-pink-600", bg: "bg-pink-100" },
    { name: "Financial Assistance", labelHi: "वित्तीय सहायता और बैंकिंग", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-100" },
    { name: "Social Welfare", labelHi: "सामाजिक न्याय और कल्याण", icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-100" },
    { name: "Entrepreneurship", labelHi: "उद्यमिता और एमएसएमई", icon: Lightbulb, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <section className="py-12 md:py-16 bg-surface border-y border-border">
      <div className="gov-container">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              {t('home.categories.badge')}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-2">{t('home.categories.title')}</h2>
            <p className="text-muted-foreground">{t('home.categories.subtitle')}</p>
          </div>
          <Link to="/categories" className="text-primary font-bold hover:underline hidden sm:flex items-center gap-1">
            <span>{t('home.categories.viewAll')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Link key={category.name} to={`/schemes?category=${encodeURIComponent(category.name)}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full border-border/70 rounded-md shadow-none bg-card">
                <CardContent className="p-5 flex flex-col items-start gap-3">
                  <div className={`p-3 rounded-md ${category.bg} dark:bg-[#292826] dark:border dark:border-[#3A3834] ${category.color}`}>
                    <category.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy">{isHi ? category.labelHi : category.name}</h3>
                    {isHi && <p className="text-xs text-muted-foreground">{category.name}</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        <div className="mt-8 text-center sm:hidden">
          <Link to="/categories" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
            <span>{t('home.categories.viewAll')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
