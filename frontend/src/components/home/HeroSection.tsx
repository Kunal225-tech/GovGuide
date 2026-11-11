import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  ArrowRight, 
  ClipboardCheck, 
  LayoutGrid, 
  Wheat, 
  GraduationCap, 
  HeartPulse, 
  Users, 
  Lightbulb, 
  House 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrustSection } from './TrustSection';
import { useAuth } from '@/context/AuthContext';
import { getSchemes } from '@/services/schemeApi';

const DIRECTORY_CATEGORIES = [
  { name: 'Agriculture & Rural', labelHi: 'कृषि और ग्रामीण', categoryKey: 'agriculture', icon: Wheat, to: '/schemes?category=Agriculture' },
  { name: 'Education & Scholarships', labelHi: 'शिक्षा और छात्रवृत्ति', categoryKey: 'education', icon: GraduationCap, to: '/schemes?category=Education' },
  { name: 'Health & Insurance', labelHi: 'स्वास्थ्य और बीमा', categoryKey: 'healthcare', icon: HeartPulse, to: '/schemes?category=Healthcare' },
  { name: 'Women & Child', labelHi: 'महिला एवं बाल कल्याण', categoryKey: 'women & child', icon: Users, to: '/schemes?category=Women%20%26%20Child' },
  { name: 'Business & MSME', labelHi: 'व्यवसाय और एमएसएमई', categoryKey: 'entrepreneurship', icon: Lightbulb, to: '/schemes?category=Entrepreneurship' },
  { name: 'Housing & Shelter', labelHi: 'आवास एवं घर', categoryKey: 'housing', icon: House, to: '/schemes?category=Housing' },
];

export function HeroSection() {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number> | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isHi = i18n.language === 'hi';

  useEffect(() => {
    let active = true;
    getSchemes()
      .then((list) => {
        if (!active) return;
        const counts: Record<string, number> = {};
        for (const s of list) {
          if (s.level === 'state' && s.state && s.state.trim().toLowerCase() !== 'bihar') {
            continue;
          }
          const key = (s.category || '').trim().toLowerCase();
          counts[key] = (counts[key] || 0) + 1;
        }
        setCategoryCounts(counts);
      })
      .catch(() => {
        // Silent fallback when backend is warming up
      });
    return () => {
      active = false;
    };
  }, []);

  function executeSearch(queryText: string) {
    const query = queryText.trim();
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: query ? `/schemes?q=${encodeURIComponent(query)}` : '/schemes' },
      });
      return;
    }

    if (!query) {
      navigate('/schemes');
      return;
    }

    navigate(`/schemes?q=${encodeURIComponent(query)}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    executeSearch(searchTerm);
  }

  return (
    <section className="relative pt-8 sm:pt-12 pb-0 bg-surface dark:bg-[#111110] flex flex-col min-h-[calc(100vh-3.5rem)] border-b border-stone-200 dark:border-[#2E2D2A]">
      <div className="gov-container relative z-10 flex-1 flex flex-col items-center justify-center pt-2 pb-10">
        <div className="w-full max-w-4xl mx-auto text-center space-y-6">
          
          {/* Eyebrow: Clean uppercase label with green verification dot */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase text-stone-600 dark:text-[#A8A29E]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] shrink-0 inline-block" />
            <span>{t('home.hero.badge', 'VERIFIED BIHAR & CENTRAL SCHEME DISCOVERY')}</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1C1B19] dark:text-[#F4F4F0] leading-[1.18] max-w-3xl mx-auto">
            {isHi ? (
              <span>अपने लिए उपयुक्त <span className="text-[#EA580C]">बिहार सरकारी योजनाएं</span> खोजें</span>
            ) : (
              <span>Find Bihar State & Central Schemes <span className="text-[#EA580C]">You Qualify For</span></span>
            )}
          </h1>
          
          {/* Subtitle */}
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto font-normal leading-relaxed">
            {t('home.hero.description', 'Discover Bihar state welfare schemes and central benefits tailored to your profile. Check instant eligibility in under 2 minutes and apply directly on verified portals.')}
          </p>

          {/* Search Bar Container: Single, unified rectangular command bar */}
          <div className="mt-8 max-w-2xl sm:max-w-[720px] mx-auto space-y-3.5 w-full">
            <form
              onSubmit={handleSearch}
              className="bg-white dark:bg-[#141413] border border-stone-300 dark:border-[#3A3834] rounded-md p-1.5 flex items-center gap-2 focus-within:border-[#1E3A8A] dark:focus-within:border-[#D95D39] focus-within:ring-1 focus-within:ring-[#1E3A8A] dark:focus-within:ring-[#D95D39] h-14 w-full transition-all"
            >
              <div className="relative flex-1 flex items-center pl-3">
                <Search className="text-stone-400 dark:text-[#A8A29E] w-5 h-5 shrink-0" />
                <Input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isHi ? "योजना का नाम या विभाग (जैसे स्टूडेंट क्रेडिट कार्ड, कन्या उत्थान, उद्यमी)..." : "Search Bihar schemes (e.g., Student Credit Card, Udyami, PM Kisan)..."}
                  className="w-full h-11 pl-3 pr-2 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base bg-transparent shadow-none placeholder:text-stone-400 dark:placeholder:text-[#A8A29E] text-[#1C1B19] dark:text-[#F4F4F0]"
                />
              </div>
              <Button
                type="submit"
                className="h-11 px-5 rounded-md text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] shrink-0 shadow-none cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <span>{isHi ? 'योजनाएं खोजें' : 'Search Schemes'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {/* Popular Searches: Bihar-specific fast chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                {isHi ? 'लोकप्रिय खोजें:' : 'Popular in Bihar:'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('Student Credit Card');
                  executeSearch('Student Credit Card');
                }}
                className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-[#1C1B19] hover:bg-stone-200 dark:hover:bg-[#292826] border border-stone-200 dark:border-[#2E2D2A] text-stone-700 dark:text-[#F4F4F0] transition-colors cursor-pointer text-xs font-medium"
              >
                {isHi ? 'स्टूडेंट क्रेडिट कार्ड' : 'Student Credit Card'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('Udyami');
                  executeSearch('Udyami');
                }}
                className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-[#1C1B19] hover:bg-stone-200 dark:hover:bg-[#292826] border border-stone-200 dark:border-[#2E2D2A] text-stone-700 dark:text-[#F4F4F0] transition-colors cursor-pointer text-xs font-medium"
              >
                {isHi ? 'मुख्यमंत्री उद्यमी (10 लाख)' : 'Udyami Yojana (₹10L)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('Kanya Utthan');
                  executeSearch('Kanya Utthan');
                }}
                className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-[#1C1B19] hover:bg-stone-200 dark:hover:bg-[#292826] border border-stone-200 dark:border-[#2E2D2A] text-stone-700 dark:text-[#F4F4F0] transition-colors cursor-pointer text-xs font-medium"
              >
                {isHi ? 'कन्या उत्थान योजना' : 'Kanya Utthan'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('Pension');
                  executeSearch('Pension');
                }}
                className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-[#1C1B19] hover:bg-stone-200 dark:hover:bg-[#292826] border border-stone-200 dark:border-[#2E2D2A] text-stone-700 dark:text-[#F4F4F0] transition-colors cursor-pointer text-xs font-medium"
              >
                {isHi ? 'वृद्धजन पेंशन (MVPY)' : 'MVPY Pension'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('Diesel Anudan');
                  executeSearch('Diesel Anudan');
                }}
                className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-[#1C1B19] hover:bg-stone-200 dark:hover:bg-[#292826] border border-stone-200 dark:border-[#2E2D2A] text-stone-700 dark:text-[#F4F4F0] transition-colors cursor-pointer text-xs font-medium"
              >
                {isHi ? 'डीजल व कृषि इनपुट' : 'Diesel & Krishi Input'}
              </button>
            </div>
          </div>

          {/* Action Hierarchy: Rectangular Buttons (rounded-md) */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="h-11 px-6 rounded-md bg-[#1E3A8A] hover:bg-[#172554] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] text-white font-medium shadow-none flex items-center gap-2 text-sm transition-colors cursor-pointer">
              <Link to="/eligible">
                <ClipboardCheck className="w-4 h-4" />
                <span>{t('home.hero.checkEligibility', 'Check My Eligibility')}</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-11 px-6 rounded-md font-medium border border-stone-300 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] text-stone-800 dark:text-[#F4F4F0] hover:bg-stone-50 dark:hover:bg-[#292826] shadow-none flex items-center gap-2 text-sm transition-colors cursor-pointer">
              <Link to="/schemes">
                <LayoutGrid className="w-4 h-4 text-stone-600 dark:text-[#A8A29E]" />
                <span>{t('home.hero.findSchemes', 'Explore All Schemes')}</span>
              </Link>
            </Button>
          </div>

          {/* Above-the-Fold Category Grid (Clean 6-Column Working Directory Grid) */}
          <div className="pt-8 w-full text-left">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-[#A8A29E]">
                {isHi ? 'श्रेणी के अनुसार योजनाएं देखें' : 'Browse Directory by Category'}
              </span>
              <Link to="/categories" className="text-xs font-semibold text-[#1E3A8A] dark:text-[#D95D39] hover:underline flex items-center gap-1">
                <span>{isHi ? 'सभी 9 क्षेत्र देखें' : 'View All 9 Sectors'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {DIRECTORY_CATEGORIES.map((cat, idx) => {
                const count = categoryCounts ? (categoryCounts[cat.categoryKey] ?? 0) : null;
                const countLabel =
                  count === null
                    ? isHi ? 'बिहार व केंद्र' : 'Bihar & Central'
                    : isHi
                      ? `${count} योजनाएं`
                      : `${count} ${count === 1 ? 'Scheme' : 'Schemes'}`;

                return (
                  <Link
                    key={idx}
                    to={cat.to}
                    className="p-3.5 rounded-md border border-stone-200 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] hover:border-[#1E3A8A] dark:hover:border-[#D95D39] transition-all flex flex-col justify-between group"
                  >
                    <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-[#292826] flex items-center justify-center text-stone-700 dark:text-[#F4F4F0] group-hover:text-[#1E3A8A] dark:group-hover:text-[#D95D39] mb-2.5 transition-colors">
                      <cat.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-xs font-semibold text-stone-900 dark:text-[#F4F4F0] group-hover:text-[#1E3A8A] dark:group-hover:text-[#D95D39] leading-tight line-clamp-1 transition-colors">
                        {isHi ? cat.labelHi : cat.name}
                      </h2>
                      <span className="text-[11px] text-stone-500 dark:text-[#A8A29E] font-normal mt-0.5 block">
                        {countLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Structured 4-Column Divided Trust Bar at the bottom */}
      <div className="w-full relative z-20 mt-auto">
        <TrustSection />
      </div>
    </section>
  );
}
