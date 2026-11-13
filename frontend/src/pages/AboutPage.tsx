import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Compass,
  Search,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  BookOpen,
  Building2,
  FileCheck2,
  Scale,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AboutPage() {
  const { t, i18n } = useTranslation();
  const isHi = i18n.language === "hi";
  const { hash } = useLocation();

  useEffect(() => {
    const targetHash = hash || window.location.hash;
    if (!targetHash) return;
    const elementId = targetHash.replace(/^#/, "");
    const target = document.getElementById(elementId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HERO / PAGE HEADER ===== */}
      <section className="border-b border-border bg-surface">
        <div className="gov-container py-12 md:py-16">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 dark:bg-[#292826] dark:text-[#F4F4F0] text-xs font-bold tracking-widest uppercase border border-stone-200 dark:border-[#3A3834] mb-4">
            <Compass className="w-3.5 h-3.5 text-primary" />
            {t('nav.about')}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-navy tracking-tight mb-4">
            {t('aboutPage.title')}
          </h1>
          <p className="text-muted-foreground max-w-3xl text-base md:text-lg leading-relaxed">
            {t('aboutPage.subtitle')}
          </p>
        </div>
      </section>

      <div className="gov-container py-12 space-y-16">
        {/* ===== SECTION 1: THE PROBLEM ===== */}
        <section aria-labelledby="problem-heading">
          <div className="max-w-2xl mb-8">
            <Badge variant="outline" className="mb-2 text-saffron border-saffron/30 bg-saffron/5 font-semibold">
              {isHi ? "चुनौती" : "The Challenge"}
            </Badge>
            <h2 id="problem-heading" className="text-2xl md:text-3xl font-bold text-navy">
              {isHi ? "कल्याणकारी योजनाओं तक पहुंच की चुनौतियां" : "The Challenge of Accessing Public Welfare"}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mt-2">
              {isHi
                ? "बिहार सरकार और भारत सरकार जनहित में अनेक कल्याणकारी योजनाएं चलाती हैं, लेकिन सही जानकारी के अभाव में करोड़ों पात्र नागरिक लाभ से वंचित रह जाते हैं।"
                : "Both the Government of Bihar and Central Ministries run impactful initiatives for education, agriculture, healthcare, and entrepreneurship. Yet, eligible citizens in Bihar often miss out due to critical discovery barriers."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border bg-surface shadow-none rounded-md">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-2">
                  <Layers className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold text-navy">
                  {isHi ? "बिखरी हुई जानकारी" : "Fragmented Information"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isHi
                    ? "योजनाओं का विवरण सैकड़ों मंत्रालयों के पोर्टलों और राजपत्रों में बिखरा हुआ है, जिससे सामान्य नागरिक के लिए पूरी जानकारी खोजना कठिन हो जाता है।"
                    : "Scheme details are dispersed across hundreds of individual ministry portals, state gazettes, and regional circulars, making comprehensive research difficult for the average citizen."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-surface shadow-none rounded-md">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold text-navy">
                  {isHi ? "जटिल पात्रता मानदंड" : "Complex Eligibility Rules"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isHi
                    ? "आय सीमा, आयु, निवास और दस्तावेजों की शर्तें जटिल होती हैं, जिन्हें बिना मार्गदर्शन समझना कठिन होता है।"
                    : "Eligibility parameters often involve intricate combinations of income thresholds, age limits, residency requirements, and documentation rules that are difficult to interpret without guidance."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-surface shadow-none rounded-md">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-md bg-stone-500/10 text-stone-600 dark:text-stone-300 flex items-center justify-center mb-2">
                  <BookOpen className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold text-navy">
                  {isHi ? "जागरूकता की कमी" : "Awareness & Guidance Gaps"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isHi
                    ? "कई नागरिकों को यह पता ही नहीं होता कि उनके व्यवसाय, उम्र या श्रेणी के लिए कोई सरकारी लाभ उपलब्ध है।"
                    : "Many individuals are simply unaware that a targeted subsidy, scholarship, or grant exists for their specific occupation, demographic background, or regional district."}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ===== SECTION 2: HOW GOVGUIDE HELPS ===== */}
        <section aria-labelledby="solution-heading" className="bg-surface-muted rounded-md p-8 md:p-12 border border-border">
          <div className="max-w-2xl mb-8">
            <Badge variant="outline" className="mb-2 text-primary border-primary/30 bg-primary/5 font-semibold">
              {isHi ? "हमारा समाधान" : "Our Solution"}
            </Badge>
            <h2 id="solution-heading" className="text-2xl md:text-3xl font-bold text-navy">
              {isHi ? "GovGuide इस अंतर को कैसे पाटता है" : "How GovGuide Bridges the Gap"}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mt-2">
              {isHi
                ? "GovGuide सरकारी योजनाओं की जानकारी को एक संरचित, खोज योग्य और पारदर्शी मंच में व्यवस्थित करता है।"
                : "GovGuide organizes government scheme information into a structured, searchable, and transparent experience."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface p-5 rounded-md border border-border shadow-none flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Search className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-navy mb-1.5 text-base">
                  {isHi ? "केंद्रीकृत निर्देशिका" : "Centralized Directory"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isHi
                    ? "एक ही स्थान पर श्रेणी, राज्य और लक्षित समूह के अनुसार केंद्र और राज्य की योजनाओं को खोजें।"
                    : "Search across central and state programs by category, state, and target group in one unified place."}
                </p>
              </div>
            </div>

            <div className="bg-surface p-5 rounded-md border border-border shadow-none flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-md bg-green/10 text-green flex items-center justify-center mb-3">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-navy mb-1.5 text-base">
                  {isHi ? "नियम-आधारित पात्रता" : "Rules-Based Eligibility"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isHi
                    ? "एक सटीक मिलान इंजन आपकी प्रोफ़ाइल का योजना नियमों से मिलान करके संभावित पात्रता की गणना करता है।"
                    : "A deterministic matching engine compares your demographic profile against scheme rules to identify potential matches."}
                </p>
              </div>
            </div>

            <div className="bg-surface p-5 rounded-md border border-border shadow-none flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-md bg-saffron/10 text-saffron flex items-center justify-center mb-3">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-navy mb-1.5 text-base">
                  {isHi ? "स्पष्ट आवश्यकताएं" : "Clear Requirements"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isHi
                    ? "आवेदन करने से पहले वित्तीय लाभ, आवश्यक पहचान दस्तावेज और आवेदन चरणों को समझें।"
                    : "Understand benefits, required identification documents, and procedural steps before applying."}
                </p>
              </div>
            </div>

            <div className="bg-surface p-5 rounded-md border border-border shadow-none flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-[#292826] text-navy dark:text-white flex items-center justify-center mb-3 border border-border">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-navy mb-1.5 text-base">
                  {isHi ? "आधिकारिक पोर्टल लिंक" : "Direct Official Links"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isHi
                    ? "प्रत्येक योजना सीधे उस आधिकारिक सरकारी पोर्टल (.gov.in) से जुड़ती है जहां वास्तविक आवेदन जमा होते हैं।"
                    : "Every scheme links directly to the designated official government portal where actual application submissions occur."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 3: OFFICIAL SOURCES & TRANSPARENCY ===== */}
        <section aria-labelledby="sources-heading">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge variant="outline" className="mb-2 text-green border-green/30 bg-green/5 font-semibold">
                {isHi ? "सत्यापित स्रोत" : "Authenticity & Trust"}
              </Badge>
              <h2 id="sources-heading" className="text-2xl md:text-3xl font-bold text-navy mb-4">
                {isHi ? "सत्यापित आधिकारिक स्रोतों की भूमिका" : "The Role of Verified Official Sources"}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-4">
                {isHi
                  ? "GovGuide केवल आधिकारिक सरकारी वेबसाइटों (.gov.in या .nic.in) से योजनाओं को सूचीबद्ध करता है ताकि नागरिक सुरक्षित रह सकें।"
                  : "In an era of rampant online misinformation and duplicate unofficial portals, authenticity is paramount. GovGuide explicitly references and links directly to official government websites (.gov.in or .nic.in)."}
              </p>
              <ul className="space-y-3 text-sm text-foreground">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green shrink-0 mt-0.5" />
                  <span>{isHi ? "योजनाओं के नाम और शर्तें आधिकारिक मंत्रालयों से ली गई हैं।" : "Scheme names and terms are sourced from official ministry publications."}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green shrink-0 mt-0.5" />
                  <span>{isHi ? "प्रत्येक योजना अधिकृत आवेदन पोर्टल का बाहरी लिंक प्रदान करती है।" : "Every scheme listing provides an outbound link to the authorized application portal."}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green shrink-0 mt-0.5" />
                  <span>{isHi ? "GovGuide पर कभी भी कोई शुल्क या संवेदनशील वित्तीय क्रेडेंशियल नहीं मांगा जाता।" : "Users are never asked to pay any fees or submit sensitive financial credentials on GovGuide."}</span>
                </li>
              </ul>
            </div>

            <Card className="border-border bg-surface p-6 shadow-none rounded-md">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="w-8 h-8 rounded-md bg-green/10 text-green flex items-center justify-center">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy text-sm">
                      {isHi ? "सीधा पोर्टल रीडायरेक्शन" : "Direct Portal Redirection"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isHi ? "दस्तावेज़ जमा करने से पहले हमेशा URL सत्यापित करें" : "Always verify the URL before submitting documents"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isHi
                    ? "जब आप GovGuide पर खोजी गई किसी योजना के लिए आवेदन करने के लिए तैयार होते हैं, तो आपको सीधे आधिकारिक विभागीय वेबसाइट पर निर्देशित किया जाता है।"
                    : "When you are ready to apply for a scheme discovered on GovGuide, you are guided directly to the official departmental website. We do not intermediate funds, accept citizen fee payments, or collect physical documents."}
                </p>
                <div className="rounded-md bg-surface-muted p-3 border border-border text-xs text-muted-foreground flex items-center gap-2">
                  <span className="font-semibold text-navy">{isHi ? "डोमेन जांच:" : "Domain Check:"}</span>
                  <span>{isHi ? "ब्राउज़र बार में .gov.in या .nic.in अवश्य देखें।" : "Look for .gov.in or .nic.in in your browser address bar."}</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ===== SECTION 4: IMPORTANT BOUNDARY & DISCLAIMER ===== */}
        <section aria-labelledby="disclaimer-heading">
          <div className="rounded-md border-2 border-amber-500/30 bg-amber-500/5 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="p-3 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-3">
                <h2 id="disclaimer-heading" className="text-xl md:text-2xl font-bold text-navy">
                  {isHi ? "महत्वपूर्ण अंतर: खोज बनाम आधिकारिक स्वीकृति" : "Important Distinction: Discovery vs. Official Approval"}
                </h2>
                <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    <strong className="text-navy font-semibold">{isHi ? "1. खोज मंच:" : "1. Informational Role:"}</strong>{" "}
                    {isHi
                      ? "GovGuide एक स्वतंत्र सूचनात्मक मंच है। पात्रता मूल्यांकन आपके द्वारा प्रदान की गई जानकारी के आधार पर एक नियम-आधारित इंजन द्वारा निकाला जाता है।"
                      : "GovGuide is an independent technological tool built to help citizens identify programs they may qualify for based on deterministic rules."}
                  </p>
                  <p>
                    <strong className="text-navy font-semibold">{isHi ? "2. कोई सरकारी संबद्धता नहीं:" : "2. Independent Entity:"}</strong>{" "}
                    {isHi
                      ? "GovGuide किसी भी सरकारी विभाग या मंत्रालय का आधिकारिक प्रतिनिधि नहीं है।"
                      : "GovGuide is an independent platform and not an official government entity."}
                  </p>
                  <p>
                    <strong className="text-navy font-semibold">{isHi ? "3. अंतिम निर्णय सरकार का:" : "3. Final Authority:"}</strong>{" "}
                    {isHi
                      ? "GovGuide पर 'पात्र' होने का अर्थ आधिकारिक स्वीकृति की गारंटी नहीं है। अंतिम अनुमोदन संबंधित सरकारी विभागों द्वारा दस्तावेजों के सत्यापन के बाद ही दिया जाता है।"
                      : "An 'Eligible' match on GovGuide does not guarantee approval. Final determination and approval rests solely with authorized government departments."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 5: CALL TO ACTION ===== */}
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
              <Link to="/how-it-works">{t('nav.howItWorks')}</Link>
            </Button>
          </div>
        </section>

        {/* ===== SECTION 6: TERMS OF USE (#terms) ===== */}
        <section id="terms" className="scroll-mt-24 pt-4">
          <Card className="border-border bg-card shadow-none">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-[#292826] border border-border flex items-center justify-center text-navy">
                  <Scale className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {isHi ? "सेवा की शर्तें" : "Civic Portal Governance"}
                  </span>
                  <CardTitle className="text-xl text-navy">
                    {isHi ? "उपयोग की शर्तें (Terms of Use)" : "Terms of Use"}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                {isHi
                  ? "GovGuide बिहार के नागरिकों को केंद्र और बिहार राज्य सरकार की कल्याणकारी योजनाओं की जानकारी, पात्रता विश्लेषण और आवेदन मार्गदर्शन प्रदान करने वाला एक स्वतंत्र सूचनात्मक पोर्टल है।"
                  : "GovGuide is an independent civic information and eligibility guidance portal designed to help Bihar residents discover Central and Bihar State welfare schemes and prepare application checklists."}
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <strong className="text-navy font-semibold">
                    {isHi ? "आधिकारिक पोर्टल पर आवेदन:" : "Official Portal Submission:"}
                  </strong>{" "}
                  {isHi
                    ? "GovGuide आवेदन फॉर्म एकत्र नहीं करता और न ही किसी योजना की स्वीकृति देता है। सभी अंतिम आवेदन संबंधित सरकारी पोर्टल (जैसे ServicePlus, RTPS, या आधिकारिक मंत्रालयों) पर ही जमा किए जाने चाहिए।"
                    : "GovGuide does not collect official applications or issue approvals. All formal submissions must be completed directly on the authorized government portal or designated DRCC/RTPS facilitation centre."}
                </li>
                <li>
                  <strong className="text-navy font-semibold">
                    {isHi ? "सूचना की सटीकता:" : "Verification Responsibility:"}
                  </strong>{" "}
                  {isHi
                    ? "योजना की पात्रता, लाभ राशि और समय-सीमा विभागीय अधिसूचनाओं के अनुसार बदल सकती है। नागरिकों को आवेदन से पहले आधिकारिक वेबसाइट पर नवीनतम दिशानिर्देश जांचने की सलाह दी जाती है।"
                    : "Scheme guidelines, financial benefits, and cut-off dates remain subject to departmental notifications. Citizens are advised to verify final requirements on the linked official portal before submitting."}
                </li>
                <li>
                  <strong className="text-navy font-semibold">
                    {isHi ? "निःशुल्क उपयोग:" : "Non-Commercial Access:"}
                  </strong>{" "}
                  {isHi
                    ? "यह पोर्टल नागरिकों के व्यक्तिगत और सूचनात्मक उपयोग के लिए पूरी तरह निःशुल्क है; किसी भी बिचौलिए को शुल्क का भुगतान न करें।"
                    : "This portal is provided strictly free of cost for personal citizen use. GovGuide never authorizes intermediaries to charge fees for scheme discovery or eligibility checks."}
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* ===== SECTION 7: PRIVACY POLICY (#privacy) ===== */}
        <section id="privacy" className="scroll-mt-24">
          <Card className="border-border bg-card shadow-none">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-[#292826] border border-border flex items-center justify-center text-navy">
                  <Lock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {isHi ? "डेटा संरक्षण नीति" : "Citizen Data Safeguards"}
                  </span>
                  <CardTitle className="text-xl text-navy">
                    {isHi ? "गोपनीयता एवं डेटा सुरक्षा नीति (Privacy Policy)" : "Privacy & Data Protection Policy"}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                {isHi
                  ? "हम नागरिक गोपनीयता और डेटा न्यूनतमकरण (Data Minimization) के सिद्धांतों का पालन करते हैं। आपकी प्रोफ़ाइल जानकारी का उपयोग केवल आपके लिए उपयुक्त योजनाओं और पात्रता मिलान दिखाने हेतु किया जाता है।"
                  : "GovGuide follows strict data-minimization principles. Profile details you enter are used exclusively to compute deterministic scheme eligibility and personalize guidance within your session."}
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <strong className="text-navy font-semibold">
                    {isHi ? "क्या संग्रहीत किया जाता है:" : "Information Stored:"}
                  </strong>{" "}
                  {isHi
                    ? "खाता पंजीकरण के लिए नाम व ईमेल और पात्रता मिलान हेतु वैकल्पिक जनसांख्यिकीय विवरण (आयु, आय सीमा, श्रेणी, व्यवसाय, जिला) सुरक्षित रूप से रखे जाते हैं।"
                    : "Account registration stores your name and email address along with optional demographic fields (age, income bracket, social category, occupation, district) needed for eligibility matching."}
                </li>
                <li>
                  <strong className="text-navy font-semibold">
                    {isHi ? "कोई आधार या बायोमेट्रिक संग्रह नहीं:" : "No Aadhaar or Biometric Storage:"}
                  </strong>{" "}
                  {isHi
                    ? "GovGuide आपका आधार नंबर, बैंक खाता विवरण या बायोमेट्रिक डेटा न तो मांगता है और न ही संग्रहीत करता है।"
                    : "GovGuide never collects, verifies, or stores Aadhaar numbers, PAN credentials, bank account numbers, or biometric records."}
                </li>
                <li>
                  <strong className="text-navy font-semibold">
                    {isHi ? "डेटा नियंत्रण व सुरक्षा:" : "Access Control & Transparency:"}
                  </strong>{" "}
                  {isHi
                    ? "पासवर्ड एन्क्रिप्टेड रूप में सुरक्षित रहते हैं और आपकी प्रोफ़ाइल जानकारी किसी तृतीय-पक्ष विज्ञापनदाता को कभी नहीं बेची या साझा की जाती है। आप किसी भी समय अपनी प्रोफ़ाइल संपादित कर सकते हैं।"
                    : "Account credentials are encrypted using industry-standard hashing, and citizen profiles are never sold or shared with third-party advertisers. You may update your profile details at any time."}
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
