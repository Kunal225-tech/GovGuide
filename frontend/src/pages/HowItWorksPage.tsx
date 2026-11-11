import type { ElementType } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Compass,
  Search,
  UserPlus,
  CheckCircle2,
  FileText,
  Bookmark,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface JourneyStep {
  stepNumber: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  details: string[];
  detailsHi: string[];
  icon: ElementType;
  badge: string;
  badgeHi: string;
  badgeColor: string;
  actionText?: string;
  actionTextHi?: string;
  actionLink?: string;
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    stepNumber: "01",
    title: "Browse & Search Government Schemes",
    titleHi: "सरकारी योजनाओं को खोजें और देखें",
    description:
      "Explore a consolidated catalog of Central and State government welfare schemes. Use sector categories, geographic state selectors, or keyword search to discover programs designed for your needs.",
    descriptionHi:
      "केंद्र और राज्य सरकार की कल्याणकारी योजनाओं की एक समेकित सूची ब्राउज़ करें। अपनी आवश्यकताओं के अनुसार क्षेत्र, राज्य या कीवर्ड से खोजें।",
    details: [
      "Filter by Central Government or specific Indian State.",
      "Browse through sectors such as Agriculture, Education, Healthcare, and Housing.",
      "Search by scheme title, benefits, or target beneficiaries.",
    ],
    detailsHi: [
      "केंद्र सरकार या विशिष्ट भारतीय राज्य द्वारा फ़िल्टर करें।",
      "कृषि, शिक्षा, स्वास्थ्य और आवास जैसे प्रमुख क्षेत्रों को ब्राउज़ करें।",
      "योजना के नाम, लाभ या लक्षित लाभार्थियों द्वारा खोजें।",
    ],
    icon: Search,
    badge: "Discovery",
    badgeHi: "खोज",
    badgeColor: "text-amber-800 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 dark:text-amber-300",
    actionText: "Browse Schemes",
    actionTextHi: "योजनाएं देखें",
    actionLink: "/schemes",
  },
  {
    stepNumber: "02",
    title: "Create an Account & Complete Your Profile",
    titleHi: "खाता बनाएं और अपनी प्रोफ़ाइल पूरी करें",
    description:
      "Sign up securely and fill in your demographic questionnaire. This simple questionnaire stores key criteria such as your age, state, annual income, occupation, education, and category in your private profile.",
    descriptionHi:
      "सुरक्षित रूप से साइन अप करें और बुनियादी विवरण दर्ज करें। यह आपकी आयु, राज्य, आय, व्यवसाय और सामाजिक वर्ग को सुरक्षित रूप से सहेजता है।",
    details: [
      "Enter basic demographics: age, state, and district.",
      "Specify your occupation (farmer, student, salaried, self-employed, etc.).",
      "Provide household income bracket and social category for accurate matching.",
    ],
    detailsHi: [
      "बुनियादी जानकारी दर्ज करें: आयु, राज्य और जिला।",
      "अपना व्यवसाय चुनें (किसान, छात्र, कर्मचारी, व्यवसायी आदि)।",
      "सटीक मिलान के लिए वार्षिक पारिवारिक आय और सामाजिक वर्ग दर्ज करें।",
    ],
    icon: UserPlus,
    badge: "Profile Setup",
    badgeHi: "प्रोफ़ाइल",
    badgeColor: "text-stone-800 bg-stone-100 dark:bg-[#292826] border-stone-200 dark:border-stone-800 dark:text-stone-300",
    actionText: "Create Account",
    actionTextHi: "खाता बनाएं",
    actionLink: "/register",
  },
  {
    stepNumber: "03",
    title: "Check Rule-Based Eligibility Results",
    titleHi: "नियम-आधारित पात्रता परिणाम जांचें",
    description:
      "Our backend rules engine compares your demographic attributes against the qualification criteria defined for each scheme. View clear, transparent results explaining why you qualify or what criterion was unmet.",
    descriptionHi:
      "हमारा सिस्टम आपकी प्रोफ़ाइल का प्रत्येक सरकारी योजना के पात्रता नियमों से मिलान करता है और पारदर्शी कारण प्रदान करता है।",
    details: [
      "Instant evaluation using our deterministic server-side rules engine.",
      "Clear 'Eligible' vs 'Not Eligible' tags for every scheme in the database.",
      "Granular failure reasons (e.g. minimum age requirement, maximum annual income cap).",
    ],
    detailsHi: [
      "नियम-आधारित इंजन द्वारा तत्काल और पारदर्शी मूल्यांकन।",
      "प्रत्येक योजना के लिए स्पष्ट 'पात्र' और 'अपात्र' परिणाम।",
      "विस्तृत कारण कि कौन सा मानदंड पूरा हुआ या नहीं।",
    ],
    icon: CheckCircle2,
    badge: "Rules Matching",
    badgeHi: "पात्रता मिलान",
    badgeColor: "text-green bg-green/10 border-green/20",
    actionText: "View Eligibility",
    actionTextHi: "पात्रता देखें",
    actionLink: "/eligible",
  },
  {
    stepNumber: "04",
    title: "Read Comprehensive Scheme Details",
    titleHi: "योजना का संपूर्ण विवरण पढ़ें",
    description:
      "Click on any scheme to review its full informational dossier. Learn exactly what financial or social benefits are provided, the official checklist of documents required, and the step-by-step application process.",
    descriptionHi:
      "किसी भी योजना पर क्लिक करके वित्तीय लाभ, आवश्यक दस्तावेज़ सूची और चरण-दर-चरण आवेदन प्रक्रिया देखें।",
    details: [
      "Summary of financial grants, subsidies, or physical assistance provided.",
      "List of required documentation (e.g. Aadhaar card, income certificate, land records).",
      "Step-by-step guidance on how the application lifecycle unfolds.",
    ],
    detailsHi: [
      "प्रदान किए जाने वाले वित्तीय अनुदान, सब्सिडी या सहायता का सारांश।",
      "आवश्यक दस्तावेजों की आधिकारिक सूची (आधार, आय प्रमाण पत्र आदि)।",
      "आवेदन प्रक्रिया का विस्तृत चरण-दर-चरण विवरण।",
    ],
    icon: FileText,
    badge: "In-Depth Dossier",
    badgeHi: "विस्तृत विवरण",
    badgeColor: "text-saffron bg-saffron/10 border-saffron/20",
    actionText: "Explore Catalog",
    actionTextHi: "सूची ब्राउज़ करें",
    actionLink: "/schemes",
  },
  {
    stepNumber: "05",
    title: "Save & Bookmark Schemes for Quick Access",
    titleHi: "त्वरित पहुंच के लिए योजनाएं सहेजें",
    description:
      "Use the one-click bookmark button to pin schemes you are interested in. Keep your personalized shortlist organized under your 'Saved Schemes' dashboard to review guidelines and deadlines anytime.",
    descriptionHi:
      "अपनी पसंदीदा योजनाओं को एक क्लिक में बुकमार्क करें और सहेजी गई योजनाओं के डैशबोर्ड में व्यवस्थित रखें।",
    details: [
      "Save schemes directly from search cards or detail pages.",
      "Access your bookmarks from any device while signed into your account.",
      "Remove or update saved programs with instant, optimistic toggling.",
    ],
    detailsHi: [
      "खोज परिणामों या विवरण पृष्ठ से सीधे योजनाएं सहेजें।",
      "अपने खाते में लॉग इन करके किसी भी डिवाइस से बुकमार्क देखें।",
      "एक क्लिक में सहेजी गई योजनाओं को प्रबंधित करें।",
    ],
    icon: Bookmark,
    badge: "Personal Shortlist",
    badgeHi: "सहेजी गई सूची",
    badgeColor: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900",
    actionText: "View Bookmarks",
    actionTextHi: "सहेजी गई सूची",
    actionLink: "/saved",
  },
  {
    stepNumber: "06",
    title: "Visit the Official Government Portal to Apply",
    titleHi: "आवेदन के लिए आधिकारिक सरकारी पोर्टल पर जाएं",
    description:
      "When you are ready to formally apply, click the verified official link provided on the scheme page. This takes you directly to the authorized government portal (.gov.in / .nic.in) where you submit your official application.",
    descriptionHi:
      "जब आप आवेदन करने के लिए तैयार हों, तो सत्यापित सरकारी लिंक (.gov.in) पर क्लिक करें और सीधे सरकारी पोर्टल पर आवेदन जमा करें।",
    details: [
      "Direct redirection to verified ministry and state administration portals.",
      "No intermediary fees, agent commissions, or data brokerage.",
      "Complete your official application, biometric authentication, and document submission safely.",
    ],
    detailsHi: [
      "सत्यापित मंत्रालय और राज्य प्रशासन पोर्टलों पर सीधा रीडायरेक्ट।",
      "कोई बिचौलिया शुल्क, दलाली या अनधिकृत डेटा साझाकरण नहीं।",
      "अपना आधिकारिक आवेदन सीधे सरकारी वेबसाइट पर सुरक्षित रूप से जमा करें।",
    ],
    icon: ExternalLink,
    badge: "Final Step",
    badgeHi: "अंतिम चरण",
    badgeColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900",
  },
];

export function HowItWorksPage() {
  const { t, i18n } = useTranslation();
  const isHi = i18n.language === "hi";

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HERO / PAGE HEADER ===== */}
      <section className="border-b border-border bg-surface">
        <div className="gov-container py-12 md:py-16">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 dark:bg-[#292826] dark:text-[#F4F4F0] text-xs font-bold tracking-widest uppercase border border-stone-200 dark:border-[#3A3834] mb-4">
            <Compass className="w-3.5 h-3.5 text-primary" />
            {t('nav.howItWorks')}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-navy tracking-tight mb-4">
            {t('howItWorksPage.title')}
          </h1>
          <p className="text-muted-foreground max-w-3xl text-base md:text-lg leading-relaxed">
            {t('howItWorksPage.subtitle')}
          </p>
        </div>
      </section>

      {/* ===== 6-STEP PROCESS ROADMAP ===== */}
      <div className="gov-container py-12 space-y-16">
        <div className="space-y-8">
          {JOURNEY_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === JOURNEY_STEPS.length - 1;
            const title = isHi ? step.titleHi : step.title;
            const description = isHi ? step.descriptionHi : step.description;
            const details = isHi ? step.detailsHi : step.details;
            const badge = isHi ? step.badgeHi : step.badge;
            const actionText = isHi ? step.actionTextHi : step.actionText;

            return (
              <div key={step.stepNumber} className="relative">
                {!isLast && (
                  <div className="hidden md:block absolute left-8 top-20 bottom-0 w-0.5 bg-border -z-10" />
                )}

                <Card className="border-border bg-surface shadow-none rounded-md transition-colors hover:border-primary/50">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                      {/* Step Number + Icon */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="w-16 h-16 rounded-md bg-surface-muted border border-border flex flex-col items-center justify-center font-extrabold text-navy shadow-none">
                          <span className="text-xs text-muted-foreground font-semibold leading-none">
                            {isHi ? "चरण" : "STEP"}
                          </span>
                          <span className="text-xl leading-none mt-1">{step.stepNumber}</span>
                        </div>
                        <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center md:hidden">
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={`text-xs font-semibold ${step.badgeColor}`}>
                            {badge}
                          </Badge>
                          <h2 className="text-xl md:text-2xl font-bold text-navy">
                            {title}
                          </h2>
                        </div>

                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                          {description}
                        </p>

                        {/* Bulleted specifics */}
                        <div className="bg-surface-muted rounded-md p-4 border border-border">
                          <ul className="space-y-2 text-xs md:text-sm text-foreground">
                            {details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {actionText && step.actionLink && (
                          <div className="pt-2">
                            <Button asChild variant="outline" size="sm" className="rounded-md font-bold text-xs border-border text-navy gap-1.5 shadow-none">
                              <Link to={step.actionLink}>
                                {actionText}
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="hidden md:flex w-14 h-14 rounded-md bg-primary/10 text-primary items-center justify-center shrink-0">
                        <Icon className="w-7 h-7" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* ===== TRUST & TRANSPARENCY NOTICE ===== */}
        <section className="rounded-md border border-border bg-surface p-8 shadow-none">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 rounded-md bg-green/10 text-green shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-navy">
                {t('home.official.badge')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('home.official.desc')}
              </p>
            </div>
          </div>
        </section>

        {/* ===== BOTTOM CTA ===== */}
        <section className="text-center py-6">
          <h2 className="text-2xl font-bold text-navy mb-3">{t('home.cta.title')}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm mb-6">
            {t('home.cta.subtitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild className="rounded-md px-6 font-bold bg-primary hover:bg-primary-hover text-white shadow-none">
              <Link to="/schemes" className="flex items-center gap-2">
                {t('home.featured.viewAll')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-md px-6 font-bold border-border text-navy shadow-none">
              <Link to="/register">{t('nav.signUp')}</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
