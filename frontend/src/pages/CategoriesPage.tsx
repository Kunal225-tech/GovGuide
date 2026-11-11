import { useState, useEffect, useMemo, useCallback, type ElementType } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  ArrowRight,
  LayoutGrid,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSchemes } from "@/services/schemeApi";
import type { Scheme } from "@/types/scheme";

interface CategoryMeta {
  name: string;
  nameHi: string;
  icon: ElementType;
  description: string;
  descriptionHi: string;
  badgeColor: string;
  iconColor: string;
  iconBg: string;
}

const SUPPORTED_CATEGORIES: CategoryMeta[] = [
  {
    name: "Education",
    nameHi: "शिक्षा और छात्रवृत्ति",
    icon: GraduationCap,
    description:
      "Scholarships, tuition fee waivers, research fellowships, and educational assistance for students in Bihar.",
    descriptionHi:
      "बिहार में छात्रों के लिए छात्रवृत्ति, शिक्षण शुल्क छूट, अनुसंधान फेलोशिप और शैक्षिक सहायता।",
    badgeColor: "text-amber-800 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300",
    iconColor: "text-amber-700 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    name: "Employment",
    nameHi: "रोजगार और आजीविका",
    icon: Briefcase,
    description:
      "Skill training, vocational certifications, rural employment guarantees, and apprenticeship programs.",
    descriptionHi:
      "कौशल प्रशिक्षण, व्यावसायिक प्रमाणन, ग्रामीण रोजगार गारंटी और शिक्षुता कार्यक्रम।",
    badgeColor: "text-stone-800 border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-[#292826] dark:text-stone-300",
    iconColor: "text-stone-700 dark:text-stone-300",
    iconBg: "bg-stone-200 dark:bg-[#1C1B19]",
  },
  {
    name: "Agriculture",
    nameHi: "कृषि और किसान कल्याण",
    icon: Wheat,
    description:
      "Direct income support, crop insurance coverage, irrigation subsidies, and fertilizer assistance for farmers.",
    descriptionHi:
      "किसानों के लिए प्रत्यक्ष आय सहायता, फसल बीमा कवरेज, सिंचाई सब्सिडी और उर्वरक सहायता।",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60",
  },
  {
    name: "Healthcare",
    nameHi: "स्वास्थ्य और चिकित्सा सहायता",
    icon: HeartPulse,
    description:
      "Universal medical insurance, secondary & tertiary care coverage, diagnostic aid, and wellness support.",
    descriptionHi:
      "सार्वभौमिक चिकित्सा बीमा, माध्यमिक एवं तृतीयक देखभाल कवरेज, नैदानिक सहायता और स्वास्थ्य सुरक्षा।",
    badgeColor: "text-rose-600 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40",
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-100 dark:bg-rose-900/30",
  },
  {
    name: "Housing",
    nameHi: "आवास एवं शहरी विकास",
    icon: House,
    description:
      "Financial assistance for pucca house construction, home loan interest subventions, and urban shelter initiatives.",
    descriptionHi:
      "पक्के मकान निर्माण के लिए वित्तीय सहायता, गृह ऋण ब्याज अनुदान और शहरी आश्रय पहल।",
    badgeColor: "text-orange-600 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40",
    iconColor: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    name: "Women & Child",
    nameHi: "महिला एवं बाल कल्याण",
    icon: Users,
    description:
      "Maternity benefits, nutritional support for infants, girl child empowerment, and self-help group support.",
    descriptionHi:
      "मातृत्व लाभ, शिशुओं के लिए पोषण संबंधी सहायता, बालिका सशक्तिकरण और स्वयं सहायता समूह सहायता।",
    badgeColor: "text-pink-600 border-pink-200 dark:border-pink-900 bg-pink-50 dark:bg-pink-950/40",
    iconColor: "text-pink-600 dark:text-pink-400",
    iconBg: "bg-pink-100 dark:bg-pink-900/30",
  },
  {
    name: "Financial Assistance",
    nameHi: "वित्तीय समावेशन और सहायता",
    icon: Wallet,
    description:
      "Direct benefit transfers (DBT), micro-pensions, loan waivers, and emergency financial safety nets.",
    descriptionHi:
      "प्रत्यक्ष लाभ अंतरण (DBT), सूक्ष्म पेंशन, ऋण माफी और आपातकालीन वित्तीय सुरक्षा जाल।",
    badgeColor: "text-emerald-600 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    name: "Social Welfare",
    nameHi: "सामाजिक न्याय और कल्याण",
    icon: ShieldCheck,
    description:
      "Support for senior citizens, persons with disabilities (PwD), widows, and marginalized social communities.",
    descriptionHi:
      "वरिष्ठ नागरिकों, दिव्यांगजनों (PwD), विधवाओं और वंचित सामाजिक समुदायों के लिए सहायता।",
    badgeColor: "text-purple-600 border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    name: "Entrepreneurship",
    nameHi: "उद्यमिता और एमएसएमई",
    icon: Lightbulb,
    description:
      "Collateral-free micro-loans, startup seed grants, incubation support, and self-employment schemes.",
    descriptionHi:
      "संपार्श्विक-मुक्त सूक्ष्म ऋण, स्टार्टअप सीड अनुदान, ऊष्मायन सहायता और स्वरोजगार योजनाएं।",
    badgeColor: "text-amber-600 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
  },
];

export function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const isHi = i18n.language === "hi";

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSchemes();
      const biharApplicable = data.filter(
        (s) => !(s.level === "state" && s.state && s.state.trim().toLowerCase() !== "bihar")
      );
      setSchemes(biharApplicable);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('common.error');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSchemesData();
  }, [fetchSchemesData]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const scheme of schemes) {
      const normalized = (scheme.category || "").trim().toLowerCase();
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
    return counts;
  }, [schemes]);

  return (
    <div className="min-h-screen bg-background">
      {/* ===== PAGE HEADER ===== */}
      <section className="border-b border-border bg-surface">
        <div className="gov-container py-12 md:py-16">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 dark:bg-[#292826] dark:text-[#F4F4F0] text-xs font-bold tracking-widest uppercase border border-stone-200 dark:border-[#3A3834] mb-4">
            <LayoutGrid className="w-3.5 h-3.5" />
            {t('nav.categories')}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-navy tracking-tight mb-4">
            {t('categoriesPage.title')}
          </h1>
          <p className="text-muted-foreground max-w-3xl text-base md:text-lg leading-relaxed">
            {t('categoriesPage.subtitle')}
          </p>
        </div>
      </section>

      {/* ===== CATEGORIES GRID ===== */}
      <div className="gov-container py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-navy">
              {t('home.categories.title')} ({SUPPORTED_CATEGORIES.length})
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {t('home.categories.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t('common.loading')}
              </span>
            ) : error ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSchemesData}
                className="text-xs text-muted-foreground hover:text-navy gap-1 h-7 px-2"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                {t('common.retry')}
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-green-700 dark:text-green-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
                {schemes.length}{" "}
                {t('categoriesPage.activeSchemesAvailable', 'Active Schemes Available')}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUPPORTED_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.name.toLowerCase()] ?? 0;
            const targetUrl = `/schemes?category=${encodeURIComponent(cat.name)}`;
            const displayName = isHi ? cat.nameHi : cat.name;
            const displayDesc = isHi ? cat.descriptionHi : cat.description;
            const countBadgeText = isHi
              ? (count === 1 ? "1 योजना उपलब्ध" : `${count} योजनाएं उपलब्ध`)
              : (count === 1 ? "1 Scheme Available" : `${count} Schemes Available`);

            return (
              <Link
                key={cat.name}
                to={targetUrl}
                className="group block focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
              >
                <Card className="h-full border-border bg-surface transition-all duration-200 group-hover:border-primary/50 shadow-none rounded-md flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${cat.iconBg} ${cat.iconColor}`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      {!isLoading && schemes.length > 0 && (
                        <Badge variant="outline" className={`text-xs font-semibold ${cat.badgeColor}`}>
                          {countBadgeText}
                        </Badge>
                      )}
                    </div>

                    <CardTitle className="text-lg font-bold text-navy group-hover:text-primary transition-colors flex items-center gap-1.5">
                      {displayName}
                    </CardTitle>
                    {isHi && <p className="text-xs text-muted-foreground">{cat.name}</p>}
                  </CardHeader>

                  <CardContent className="pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {displayDesc}
                    </p>
                  </CardContent>

                  <CardFooter className="pt-0 text-xs font-bold text-primary flex items-center justify-between border-t border-border/50 py-3 mt-auto">
                    <span>{t('categoriesPage.viewSchemes')}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* ===== FOOTER CTA ===== */}
        <div className="mt-16 rounded-md bg-surface-muted border border-border p-8 text-center max-w-2xl mx-auto shadow-none">
          <h3 className="text-xl font-bold text-navy mb-2">{t('home.cta.title')}</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {t('home.cta.subtitle')}
          </p>
          <Button asChild className="rounded-md px-6 font-bold bg-primary hover:bg-primary-hover text-white shadow-none">
            <Link to="/schemes" className="inline-flex items-center gap-2">
              {t('home.featured.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
