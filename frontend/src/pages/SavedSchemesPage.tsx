import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
  AlertCircle,
  RefreshCcw,
  ClipboardCheck,
} from "lucide-react";
import { useSavedSchemes } from "@/context/SavedSchemesContext";
import type { Scheme } from "@/types/scheme";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/SaveButton";

// ============================================================
// SavedSchemesPage
// Route: /saved (Protected Route)
// ============================================================

export function SavedSchemesPage() {
  const { t } = useTranslation();
  const { savedItems, isLoading, error, refresh } = useSavedSchemes();

  const savedSchemes = savedItems
    .map((item) => item.scheme)
    .filter((scheme): scheme is Scheme => scheme != null && !!scheme._id);

  return (
    <div className="min-h-screen bg-background">
      {/* ---- Page Header ---- */}
      <div className="border-b border-border bg-surface">
        <div className="gov-container py-10 md:py-12">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 dark:bg-[#292826] dark:text-[#F4F4F0] text-xs font-bold tracking-widest uppercase border border-stone-200 dark:border-[#3A3834] mb-4">
            <BookmarkCheck className="w-3.5 h-3.5" />
            {t('nav.saved')}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-navy mb-3">
                {t('saved.title')}
              </h1>
              <p className="text-muted-foreground max-w-2xl text-base">
                {t('saved.subtitle')}
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-md border-border font-bold text-navy shrink-0 gap-1.5 h-10 shadow-none">
              <Link to="/applications">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                <span>{t('nav.applicationTracker')}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="gov-container py-10">
        {/* Loading State */}
        {isLoading && <LoadingGrid />}

        {/* Error State */}
        {!isLoading && error && (
          <ErrorState message={error} onRetry={refresh} />
        )}

        {/* Empty Saved Schemes State */}
        {!isLoading && !error && savedSchemes.length === 0 && (
          <EmptySavedState />
        )}

        {/* Saved Schemes Grid */}
        {!isLoading && !error && savedSchemes.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground border-b border-border/60 pb-3">
              <p>
                {t('schemes.showingResults', { count: savedSchemes.length })}
              </p>
              <Button asChild variant="outline" size="sm" className="rounded-md text-xs font-semibold">
                <Link to="/schemes">
                  <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                  {t('saved.browseBtn', t('saved.browseSchemes', 'Explore Schemes'))}
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedSchemes.map((scheme) => (
                <SavedSchemeCard key={scheme._id} scheme={scheme} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SavedSchemeCard
// ============================================================
function SavedSchemeCard({ scheme }: { scheme: Scheme }) {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col bg-card border-border hover:border-primary/50 transition-all duration-200 h-full relative group rounded-md shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-700 dark:bg-[#292826] dark:text-[#F4F4F0] border border-stone-200 dark:border-[#3A3834]">
              {scheme.category}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                scheme.level === "central"
                  ? "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-900/40"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40"
              }`}
            >
              {scheme.level === "central" ? t('schemes.central') : (scheme.state || t('schemes.state'))}
            </span>
          </div>

          <SaveButton schemeId={scheme._id} schemeName={scheme.name} />
        </div>

        <CardTitle className="text-lg text-navy leading-snug line-clamp-2">
          {scheme.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-muted-foreground text-sm line-clamp-3">
          {scheme.description}
        </p>

        {scheme.benefits && scheme.benefits.length > 0 && (
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
// EmptySavedState
// ============================================================
function EmptySavedState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4 max-w-md mx-auto">
      <div className="p-4 rounded-md bg-surface-muted text-saffron border border-border">
        <Bookmark className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-navy">{t('saved.emptyTitle')}</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {t('saved.emptyDesc')}
      </p>
      <Button
        asChild
        className="mt-2 rounded-md font-bold px-6 bg-primary hover:bg-primary-hover text-white shadow-none"
      >
        <Link to="/schemes">
          <LayoutGrid className="w-4 h-4 mr-2" />
          {t('saved.browseBtn', t('saved.browseSchemes', 'Explore Schemes'))}
        </Link>
      </Button>
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
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-border bg-card p-6 space-y-4 animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <div className="h-5 w-20 bg-muted rounded-md" />
                <div className="h-5 w-16 bg-muted rounded-md" />
              </div>
              <div className="h-6 w-6 bg-muted rounded-md" />
            </div>
            <div className="h-5 w-3/4 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
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
