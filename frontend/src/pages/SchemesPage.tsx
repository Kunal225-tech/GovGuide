import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  X,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  AlertCircle,
  LayoutGrid,
  RefreshCcw,
  Inbox,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useAiAssistant } from "@/context/AiAssistantContext";
import { getSchemes } from "@/services/schemeApi";
import type { Scheme } from "@/types/scheme";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SaveButton } from "@/components/SaveButton";

// ============================================================
// Filter Constants & Options
// ============================================================

const SCHEME_CATEGORIES = [
  "All",
  "Education",
  "Employment",
  "Agriculture",
  "Healthcare",
  "Housing",
  "Women & Child",
  "Financial Assistance",
  "Social Welfare",
  "Entrepreneurship",
] as const;

const SOCIAL_CATEGORIES = [
  { id: "all", labelEn: "All Categories", labelHi: "सभी सामाजिक वर्ग" },
  { id: "General", labelEn: "General (Unreserved)", labelHi: "सामान्य (General)" },
  { id: "EBC", labelEn: "EBC (Extremely Backward Class)", labelHi: "ईबीसी (EBC)" },
  { id: "OBC", labelEn: "BC / OBC", labelHi: "पिछड़ा वर्ग (BC / OBC)" },
  { id: "SC", labelEn: "SC (Scheduled Caste)", labelHi: "अनुसूचित जाति (SC)" },
  { id: "ST", labelEn: "ST (Scheduled Tribe)", labelHi: "अनुसूचित जनजाति (ST)" },
  { id: "Minority", labelEn: "Minority", labelHi: "अल्पसंख्यक (Minority)" },
] as const;

const BIHAR_DISTRICTS = [
  "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar",
  "Darbhanga", "East Champaran (Motihari)", "Gaya", "Gopalganj", "Jamui", "Jehanabad",
  "Kaimur (Bhabua)", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura",
  "Madhubani", "Munger", "Muzaffarpur", "Nalanda (Bihar Sharif)", "Nawada", "Patna",
  "Purnia", "Rohtas (Sasaram)", "Saharsa", "Samastipur", "Saran (Chhapra)", "Sheikhpura",
  "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali (Hajipur)", "West Champaran (Bettiah)"
];

export type GovernmentLevel = "all" | "central" | "state";

const CATEGORY_TRANSLATIONS: Record<string, { hi: string }> = {
  All: { hi: "सभी श्रेणियां" },
  Education: { hi: "शिक्षा" },
  Employment: { hi: "रोजगार" },
  Agriculture: { hi: "कृषि" },
  Healthcare: { hi: "स्वास्थ्य" },
  Housing: { hi: "आवास" },
  "Women & Child": { hi: "महिला एवं बाल" },
  "Financial Assistance": { hi: "वित्तीय सहायता" },
  "Social Welfare": { hi: "सामाजिक कल्याण" },
  Entrepreneurship: { hi: "उद्यमिता" },
};

// ============================================================
// SchemesPage - dynamically fetches schemes from backend with
// deterministic client-side search and filtering
// Route: /schemes
// ============================================================

export function SchemesPage() {
  const { t, i18n } = useTranslation();
  const isHi = i18n.language === "hi";

  // --- URL SEARCH PARAMS ---
  const [searchParams, setSearchParams] = useSearchParams();

  // --- RAW DATA STATE ---
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState<string>(
    () => searchParams.get("q") || searchParams.get("search") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const cat = searchParams.get("category");
    if (cat) {
      const matched = SCHEME_CATEGORIES.find(
        (c) => c.toLowerCase() === cat.toLowerCase()
      );
      if (matched) return matched;
    }
    return "All";
  });
  const [selectedLevel, setSelectedLevel] = useState<GovernmentLevel>(() => {
    const lvl = searchParams.get("level");
    if (lvl === "all" || lvl === "central" || lvl === "state") return lvl;
    return "all";
  });
  const [selectedSocialCategory, setSelectedSocialCategory] = useState<string>(
    () => searchParams.get("socialCategory") || "all"
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    () => searchParams.get("district") || ""
  );
  const [sortBy, setSortBy] = useState<string>("recommended");

  // --- MOBILE FILTER TOGGLE ---
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  // Sync state from URL query parameters (e.g. /schemes?category=Education)
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const categoryFromUrl = searchParams.get("category");
      if (categoryFromUrl) {
        const matched = SCHEME_CATEGORIES.find(
          (c) => c.toLowerCase() === categoryFromUrl.toLowerCase()
        );
        if (matched) {
          setSelectedCategory(matched);
        }
      } else {
        setSelectedCategory("All");
      }

      const searchFromUrl = searchParams.get("q") || searchParams.get("search");
      if (searchFromUrl !== null) {
        setSearchQuery(searchFromUrl);
      }

      const levelFromUrl = searchParams.get("level");
      if (levelFromUrl === "all" || levelFromUrl === "central" || levelFromUrl === "state") {
        setSelectedLevel(levelFromUrl);
      }

      const socialCatFromUrl = searchParams.get("socialCategory");
      if (socialCatFromUrl) {
        setSelectedSocialCategory(socialCatFromUrl);
      }

      const districtFromUrl = searchParams.get("district");
      if (districtFromUrl) {
        setSelectedDistrict(districtFromUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const fetchSchemes = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getSchemes()
      .then((data) => {
        setSchemes(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching schemes:", err);
        setError("Failed to load schemes. Please try again later.");
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  // Update URL search parameters when filters change
  const updateUrlParams = (
    query: string,
    category: string,
    level: GovernmentLevel,
    socialCat: string,
    district: string
  ) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category && category !== "All") params.set("category", category);
    if (level && level !== "all") params.set("level", level);
    if (socialCat && socialCat !== "all") params.set("socialCategory", socialCat);
    if (district) params.set("district", district);
    setSearchParams(params, { replace: true });
  };

  // Filter Handlers
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    updateUrlParams(searchQuery, category, selectedLevel, selectedSocialCategory, selectedDistrict);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedLevel("all");
    setSelectedSocialCategory("all");
    setSelectedDistrict("");
    setSortBy("recommended");
    setSearchParams({}, { replace: true });
  };

  // Compute number of active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedCategory !== "All") count++;
    if (selectedLevel !== "all") count++;
    if (selectedSocialCategory !== "all") count++;
    if (selectedDistrict) count++;
    if (sortBy !== "recommended") count++;
    return count;
  }, [searchQuery, selectedCategory, selectedLevel, selectedSocialCategory, selectedDistrict, sortBy]);

  // Client-side deterministic filtering and sorting logic
  const filteredSchemes = useMemo(() => {
    const list = schemes.filter((scheme) => {
      // 1. Text Search Filter (name or description)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = scheme.name.toLowerCase().includes(query);
        const matchesDesc = scheme.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== "All") {
        if (scheme.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // 3. Government Level Filter
      if (selectedLevel !== "all") {
        if (scheme.level.toLowerCase() !== selectedLevel.toLowerCase()) {
          return false;
        }
      }

      // 4. Bihar State Scope (Dedicated portal for Bihar: show Bihar state schemes and pan-India central schemes)
      if (scheme.level === "state" && scheme.state && scheme.state.toLowerCase() !== "bihar") {
        return false;
      }

      // 5. Social Category Filter
      if (selectedSocialCategory !== "all") {
        const cat = selectedSocialCategory.toLowerCase();
        const nameLower = scheme.name.toLowerCase();
        if (cat === "general") {
          if ((nameLower.includes("sc/st") || nameLower.includes("ebc")) && !nameLower.includes("yuva")) {
            return false;
          }
        } else if (cat === "ebc") {
          if (nameLower.includes("sc/st") && !nameLower.includes("ebc")) {
            return false;
          }
        } else if (cat === "sc" || cat === "st") {
          if (nameLower.includes("ebc") && !nameLower.includes("sc")) {
            return false;
          }
        } else if (cat === "minority") {
          if (nameLower.includes("sc/st") || nameLower.includes("ebc")) {
            return false;
          }
        } else if (cat === "obc") {
          if (nameLower.includes("sc/st")) {
            return false;
          }
        }
      }

      return true;
    });

    if (sortBy === "name-asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "popular") {
      list.sort((a, b) => (b.benefits?.length || 0) - (a.benefits?.length || 0));
    }

    return list;
  }, [schemes, searchQuery, selectedCategory, selectedLevel, selectedSocialCategory, sortBy]);

  function getCategoryLabel(cat: string) {
    if (isHi && CATEGORY_TRANSLATIONS[cat]) {
      return CATEGORY_TRANSLATIONS[cat].hi;
    }
    return cat === "All" ? t('common.all') : cat;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ---- PAGE HEADER ---- */}
      <div className="border-b border-border bg-surface">
        <div className="gov-container py-10 md:py-12">
          <div className="inline-block px-3.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase border border-primary/20 mb-4">
            GovGuide
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-navy mb-3">
            {t('schemes.title')}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-base">
            {t('schemes.subtitle')}
          </p>
        </div>
      </div>

      <div className="gov-container py-8 pb-28 sm:pb-32 space-y-6">
        {/* ===== FILTER SECTION ===== */}
        {!isLoading && !error && schemes.length > 0 && (
          <div className="space-y-4">
            {/* Top Row: Search Input + Mobile Filters Toggle + Clear Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="scheme-search-input"
                  type="text"
                  placeholder={t('schemes.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-9 h-11 bg-card border-border rounded-md text-sm text-foreground focus-visible:ring-primary shadow-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search query"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Mobile Filter Toggle Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
                className="sm:hidden flex items-center justify-center gap-2 h-11 border-border font-medium bg-card text-foreground rounded-md shadow-none"
              >
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <span>{t('schemes.filterTitle')}</span>
                {activeFiltersCount > 0 && (
                  <Badge className="ml-1 h-5 px-1.5 text-xs bg-primary text-primary-foreground rounded-md">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Quick Category Pills (Horizontal Scrollable) */}
            <div className="overflow-x-auto pb-1 pt-0.5 -mx-1 px-1 scrollbar-none flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 mr-1 hidden md:inline">
                {t('schemes.categoryLabel')}:
              </span>
              {SCHEME_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`shrink-0 text-xs px-3.5 py-1.5 rounded-md transition-colors font-medium border ${
                      isSelected
                        ? "bg-stone-900 text-white border-[#D95D39] dark:bg-[#292826] dark:text-[#F4F4F0] dark:border-[#D95D39] font-semibold"
                        : "bg-card text-muted-foreground border-border/80 hover:border-primary/40 hover:text-foreground hover:bg-surface-muted"
                    }`}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                );
              })}
            </div>

            {/* Detailed Controls Bar */}
            <div
              className={`pt-1 ${
                isMobileFiltersOpen ? "block" : "hidden sm:block"
              }`}
            >
              <div className="p-4 rounded-md bg-card border border-border space-y-4 shadow-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  {/* Filter 1: Sort By Dropdown */}
                  <div>
                    <label
                      htmlFor="scheme-sort-select"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                    >
                      {t('schemes.sortBy', 'Sort By')}
                    </label>
                    <select
                      id="scheme-sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background dark:bg-[#141413] dark:border-[#3A3834] px-3 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px]"
                    >
                      <option value="recommended">{t('schemes.sortRecommended', 'Recommended')}</option>
                      <option value="popular">{t('schemes.sortPopular', 'Most Popular')}</option>
                      <option value="name-asc">{t('schemes.sortAsc', 'Name: A to Z')}</option>
                      <option value="name-desc">{t('schemes.sortDesc', 'Name: Z to A')}</option>
                    </select>
                  </div>

                  {/* Filter 2: Government Level Segmented Buttons */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {t('schemes.levelLabel', 'Government Level')}
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-surface-muted p-1 rounded-md border border-border/60 h-10 items-center">
                      {(
                        [
                          { id: "all", label: t('common.all', 'All') },
                          { id: "central", label: t('schemes.central', 'Central') },
                          { id: "state", label: t('schemes.state', 'State') },
                        ] as const
                      ).map((levelOpt) => {
                        const isSelected = selectedLevel === levelOpt.id;
                        return (
                          <button
                            key={levelOpt.id}
                            type="button"
                            onClick={() => setSelectedLevel(levelOpt.id)}
                            className={`h-8 rounded-md text-xs font-medium transition-colors flex items-center justify-center ${
                              isSelected
                                ? "bg-card text-foreground font-semibold border border-border"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {levelOpt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filter 3: Social Category */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="scheme-category-select"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {isHi ? 'सामाजिक वर्ग (Social Category)' : 'Social Category'}
                      </label>
                    </div>
                    <select
                      id="scheme-category-select"
                      value={selectedSocialCategory}
                      onChange={(e) => setSelectedSocialCategory(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background dark:bg-[#141413] dark:border-[#3A3834] px-3 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px]"
                    >
                      {SOCIAL_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {isHi ? cat.labelHi : cat.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter 4: Bihar District Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="scheme-district-select"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {isHi ? 'बिहार जिला (Bihar District)' : 'Bihar District'}
                      </label>
                    </div>
                    <select
                      id="scheme-district-select"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background dark:bg-[#141413] dark:border-[#3A3834] px-3 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px]"
                    >
                      <option value="">{isHi ? 'सभी 38 जिले' : 'All 38 Districts'}</option>
                      {BIHAR_DISTRICTS.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active filter badges / quick remove */}
                {activeFiltersCount > 0 && (
                  <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground font-medium">{t('schemes.filterTitle')}:</span>
                    {searchQuery.trim() && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 bg-surface-muted text-foreground px-2.5 py-1 rounded-md"
                      >
                        <span>"{searchQuery}"</span>
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          aria-label="Remove search filter"
                          className="hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedCategory !== "All" && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 bg-surface-muted text-foreground px-2.5 py-1 rounded-md"
                      >
                        <span>{getCategoryLabel(selectedCategory)}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedCategory("All")}
                          aria-label="Remove category filter"
                          className="hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedLevel !== "all" && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 bg-surface-muted text-foreground px-2.5 py-1 rounded-md"
                      >
                        <span className="capitalize">{selectedLevel === "central" ? (isHi ? 'केंद्रीय' : 'Central') : (isHi ? 'राज्य' : 'State')}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedLevel("all")}
                          aria-label="Remove level filter"
                          className="hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedSocialCategory !== "all" && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 bg-surface-muted text-foreground px-2.5 py-1 rounded-md"
                      >
                        <span>{SOCIAL_CATEGORIES.find((c) => c.id === selectedSocialCategory)?.[isHi ? 'labelHi' : 'labelEn'] || selectedSocialCategory}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedSocialCategory("all")}
                          aria-label="Remove social category filter"
                          className="hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {selectedDistrict && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 bg-stone-100 text-stone-800 dark:bg-[#292826] dark:text-[#F4F4F0] px-2.5 py-1 rounded-md font-semibold border border-stone-200 dark:border-[#3A3834]"
                      >
                        <span>📍 {selectedDistrict}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedDistrict("")}
                          aria-label="Remove district filter"
                          className="hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-xs text-primary hover:underline font-semibold ml-1 cursor-pointer"
                    >
                      {t('common.clearAll', 'Clear All')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== LOADING STATE ===== */}
        {isLoading && <LoadingGrid />}

        {/* ===== ERROR STATE ===== */}
        {!isLoading && error && (
          <ErrorState message={error} onRetry={fetchSchemes} />
        )}

        {/* ===== EMPTY DATABASE STATE ===== */}
        {!isLoading && !error && schemes.length === 0 && <EmptyState />}

        {/* ===== ZERO FILTERED RESULTS STATE ===== */}
        {!isLoading && !error && schemes.length > 0 && filteredSchemes.length === 0 && (
          <NoFilteredResultsState
            searchQuery={searchQuery}
            onReset={handleClearFilters}
          />
        )}

        {/* ===== SUCCESS STATE - Scheme Cards Grid ===== */}
        {!isLoading && !error && filteredSchemes.length > 0 && (
          <div className="space-y-6">
            {/* District Guidance Callout for Bihar */}
            {selectedDistrict && (
              <div className="p-4 rounded-md bg-stone-100 dark:bg-[#1C1B19] border border-stone-300 dark:border-[#2E2D2A] flex items-start sm:items-center justify-between gap-3 text-xs text-stone-900 dark:text-[#F4F4F0]">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl shrink-0">📍</span>
                  <span className="leading-relaxed">
                    {isHi ? (
                      <>
                        <strong>{selectedDistrict}</strong> जिले के लिए योजनाएं प्रदर्शित हैं। युवा योजनाओं (स्टूडेंट क्रेडिट कार्ड, स्वयं सहायता भत्ता, KYP) के मूल प्रमाण-पत्र सत्यापन हेतु अपने जिले के <strong>DRCC कार्यालय</strong> से संपर्क करें।
                      </>
                    ) : (
                      <>
                        Showing welfare programs applicable in <strong>{selectedDistrict}</strong> district. For youth schemes (BSCCS, SHA, KYP), physical document verification takes place at your local <strong>DRCC office</strong>.
                      </>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDistrict("")}
                  className="text-[#D95D39] hover:underline font-bold shrink-0 ml-2 cursor-pointer"
                >
                  {isHi ? 'हटाएं' : 'Clear'}
                </button>
              </div>
            )}

            {/* Result count */}
            <div className="flex items-center justify-between text-sm text-muted-foreground border-b border-border/60 pb-3">
              <p>
                {t('schemes.showingResults', { count: filteredSchemes.length })}
              </p>
              {activeFiltersCount > 0 && (
                <span className="text-xs text-primary font-medium">
                  {isHi
                    ? `${activeFiltersCount} सक्रिय फ़िल्टर`
                    : activeFiltersCount === 1
                      ? '1 active filter'
                      : `${activeFiltersCount} active filters`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSchemes.map((scheme) => (
                <SchemeCard key={scheme._id} scheme={scheme} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SchemeCard
// ============================================================
function SchemeCard({ scheme }: { scheme: Scheme }) {
  const { t, i18n } = useTranslation();
  const isHi = i18n.language === 'hi';

  return (
    <Card className="flex flex-col bg-card border-border/70 hover:border-primary/50 transition-colors h-full rounded-md shadow-none">
      <CardHeader className="pb-3">
        {/* Category badge + level badge + Save toggle */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-800 dark:bg-[#292826] dark:text-[#F4F4F0] dark:border dark:border-[#3A3834]">
              {scheme.category}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${
                scheme.level === "central"
                  ? "bg-orange-50 text-orange-700 dark:bg-[#292826] dark:text-orange-300 dark:border dark:border-orange-900/40"
                  : "bg-emerald-50 text-emerald-700 dark:bg-[#292826] dark:text-emerald-300 dark:border dark:border-emerald-900/40"
              }`}
            >
              {scheme.level === "central"
                ? (isHi ? "केंद्रीय" : "Central")
                : (isHi ? "बिहार सरकार" : "Bihar State")}
            </span>

            {/* Special 7-Nischay Flagship Badge */}
            {(scheme.name.toLowerCase().includes('student credit') || 
              scheme.name.toLowerCase().includes('swayam sahayata') || 
              scheme.name.toLowerCase().includes('kushal yuva') || 
              scheme.aliases?.some((a) => a.toLowerCase().includes('nischay') || a.toLowerCase().includes('nishchay')) ||
              scheme.description.toLowerCase().includes('7-nischay') ||
              scheme.description.toLowerCase().includes('saat nischay')) && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-[#292826] dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                {isHi ? "⭐ 7 निश्चय" : "⭐ 7 Nischay"}
              </span>
            )}

            {/* Medhasoft / e-Kalyan Badge */}
            {(scheme.officialUrl?.includes('medhasoft') || 
              scheme.name.toLowerCase().includes('kanya utthan') ||
              scheme.name.toLowerCase().includes('protsahan')) && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-[#292826] dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                {isHi ? "🎓 मेधासॉफ्ट" : "🎓 Medhasoft"}
              </span>
            )}

            {/* DBT Agriculture Badge */}
            {(scheme.officialUrl?.includes('dbtagriculture') || 
              scheme.name.toLowerCase().includes('diesel anudan') || 
              scheme.name.toLowerCase().includes('krishi input')) && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-green-100 text-green-800 dark:bg-[#292826] dark:text-green-300 border border-green-200 dark:border-green-800/60">
                {isHi ? "🌾 DBT कृषि" : "🌾 DBT Agriculture"}
              </span>
            )}
          </div>

          <SaveButton schemeId={scheme._id} schemeName={scheme.name} />
        </div>

        <CardTitle className="text-lg text-navy leading-snug line-clamp-2">
          {scheme.name}
        </CardTitle>

        {/* Application Mode Badge */}
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-[#A8A29E] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{isHi ? 'आवेदन: ऑनलाइन / RTPS / वसुधा केंद्र' : 'Mode: Online / RTPS / Vasudha Kendra'}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-muted-foreground text-sm line-clamp-3">
          {scheme.description}
        </p>

        {scheme.benefits.length > 0 && (
          <ul className="mt-3 space-y-1">
            {scheme.benefits.slice(0, 2).map((benefit, i) => (
              <li
                key={i}
                className="text-xs text-muted-foreground flex items-start gap-1.5"
              >
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="pt-0 border-t border-border/50 mt-auto px-6 py-4 flex items-center justify-between gap-2">
        <Link
          to={`/schemes/${scheme._id}`}
          className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
        >
          {t('common.viewDetails')}
          <ChevronRight className="w-4 h-4" />
        </Link>

        {scheme.officialUrl && (
          <a
            href={scheme.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            {t('common.officialSource')}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardFooter>
    </Card>
  );
}

// ============================================================
// NoFilteredResultsState
// ============================================================
function NoFilteredResultsState({
  searchQuery,
  onReset,
}: {
  searchQuery?: string;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const { openAssistant } = useAiAssistant();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-md border border-dashed border-border bg-surface/50">
      <div className="p-3.5 rounded-md bg-stone-100 dark:bg-[#1C1B19] border border-stone-200 dark:border-[#2E2D2A] text-muted-foreground mb-4">
        <Search className="w-7 h-7 opacity-70" />
      </div>
      <h2 className="text-xl font-bold text-navy mb-2">{t('schemes.noResultsTitle')}</h2>
      <p className="text-muted-foreground text-sm max-w-md mb-5 leading-relaxed">
        {t('schemes.noResultsDesc')}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {searchQuery && searchQuery.trim() && (
          <Button
            onClick={() => openAssistant(searchQuery)}
            className="flex items-center gap-2 rounded-md font-semibold px-5 h-10 bg-[#D95D39] hover:bg-[#C44D2B] text-white shadow-none cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Ask Saathi AI for "{searchQuery}"</span>
          </Button>
        )}
        <Button
          onClick={onReset}
          variant="outline"
          className="flex items-center gap-2 rounded-md font-semibold px-5 h-10 border-border text-foreground shadow-none cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          {t('schemes.resetFilters')}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// LoadingGrid
// ============================================================
function LoadingGrid() {
  return (
    <div>
      <div className="h-4 w-32 bg-muted animate-pulse rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-border bg-card p-6 space-y-4 animate-pulse shadow-none"
          >
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-muted rounded-md" />
              <div className="h-5 w-16 bg-muted rounded-md" />
            </div>
            <div className="h-5 w-3/4 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
            <div className="h-4 w-4/6 bg-muted rounded" />
            <div className="pt-4 border-t border-border">
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ErrorState
// ============================================================
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-navy">{t('common.error')}</h2>
      <p className="text-muted-foreground text-sm max-w-sm">{message}</p>
      <Button
        onClick={onRetry}
        variant="outline"
        className="mt-2 flex items-center gap-2 rounded-md font-bold text-navy border-border"
      >
        <RefreshCcw className="w-4 h-4" />
        {t('common.retry')}
      </Button>
    </div>
  );
}

// ============================================================
// EmptyState
// ============================================================
function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="p-4 rounded-md bg-surface-muted text-muted-foreground border border-border">
        <Inbox className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-navy">{t('schemes.noResultsTitle')}</h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        {t('schemes.noResultsDesc')}
      </p>
      <Button
        asChild
        variant="outline"
        className="mt-2 flex items-center gap-2 rounded-md font-bold text-navy border-border"
      >
        <Link to="/">
          <LayoutGrid className="w-4 h-4" />
          {t('common.back')}
        </Link>
      </Button>
    </div>
  );
}
