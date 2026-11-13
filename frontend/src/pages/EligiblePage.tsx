import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCcw,
  ChevronRight,
  UserCog,
  Info,
  SlidersHorizontal,
  HelpCircle,
} from 'lucide-react';
import { getEligibility } from '@/services/eligibilityApi';
import { AuthError } from '@/services/profileApi';
import type { EligibilityResult } from '@/types/eligibility';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ============================================================
// EligiblePage
// Route: /eligible  (protected -- requires auth)
// ============================================================

type PageState = 'loading' | 'error' | 'incomplete-profile' | 'empty' | 'ready';

export function EligiblePage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const [results, setResults] = useState<EligibilityResult[]>([]);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEligibility() {
    setPageState('loading');
    setErrorMsg('');
    try {
      const data = await getEligibility();

      if (data.length === 0) {
        setPageState('empty');
        return;
      }

      // If all results are unverified due to missing profile information, show profile prompt
      const allUnverifiedOrFailed = data.every((r) => r.status !== 'eligible');
      const hasMissingProfileFields = data.some(
        (r) =>
          (r.missingProfileFields && r.missingProfileFields.length > 0) ||
          r.reasons.some((reason) =>
            /not specified in (your )?profile|not provided in profile/i.test(reason)
          )
      );

      const missingCoreProfile =
        !user?.profile?.age &&
        !user?.profile?.gender &&
        !user?.profile?.category &&
        !user?.profile?.occupation;

      if (allUnverifiedOrFailed && hasMissingProfileFields && missingCoreProfile) {
        setResults(data);
        setPageState('incomplete-profile');
        return;
      }

      setResults(data);
      setPageState('ready');
    } catch (err) {
      if (err instanceof AuthError) {
        logout();
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load eligibility results.');
        setPageState('error');
      }
    }
  }

  const matching = results.filter((r) => r.status === 'eligible');
  const unverified = results.filter((r) => r.status === 'unverified');
  const notMatching = results.filter((r) => r.status === 'ineligible');

  return (
    <div className="min-h-screen bg-background">
      {/* ---- PAGE HEADER ---- */}
      <div className="border-b border-border bg-surface">
        <div className="gov-container py-10 md:py-14">
          <div className="inline-block px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 dark:bg-[#292826] dark:text-[#F4F4F0] text-xs font-bold tracking-widest uppercase border border-stone-200 dark:border-[#3A3834] mb-4">
            {t('home.hero.checkEligibility')}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-navy mb-3">
            {t('eligible.title')}
          </h1>
          <p className="text-muted-foreground max-w-xl">
            {t('eligible.subtitle')}
          </p>

          {/* Disclaimer banner */}
          <div className="mt-5 flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-4 py-3 max-w-2xl">
            <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-snug">
              <strong>{t('common.disclaimer')}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ---- BODY ---- */}
      <div className="gov-container py-10">
        {/* ===== LOADING ===== */}
        {pageState === 'loading' && <LoadingState />}

        {/* ===== ERROR ===== */}
        {pageState === 'error' && (
          <ErrorState message={errorMsg} onRetry={fetchEligibility} />
        )}

        {/* ===== EMPTY ===== */}
        {pageState === 'empty' && <EmptyState />}

        {/* ===== INCOMPLETE PROFILE ===== */}
        {pageState === 'incomplete-profile' && (
          <IncompleteProfileState
            userName={user?.name}
            results={results}
            onRetry={fetchEligibility}
          />
        )}

        {/* ===== RESULTS ===== */}
        {pageState === 'ready' && results.length > 0 && (
          <ResultsView
            matching={matching}
            unverified={unverified}
            notMatching={notMatching}
            onRetry={fetchEligibility}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// ResultsView
// ============================================================
function ResultsView({
  matching,
  unverified,
  notMatching,
  onRetry,
}: {
  matching: EligibilityResult[];
  unverified: EligibilityResult[];
  notMatching: EligibilityResult[];
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-12">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4">
        <StatChip
          color="green"
          count={matching.length}
          label={t('eligible.tabEligible')}
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
        <StatChip
          color="amber"
          count={unverified.length}
          label={t('eligible.tabUnverified')}
          icon={<HelpCircle className="w-4 h-4" />}
        />
        <StatChip
          color="muted"
          count={notMatching.length}
          label={t('eligible.tabIneligible')}
          icon={<XCircle className="w-4 h-4" />}
        />
        <button
          onClick={onRetry}
          className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
          aria-label={t('common.retry')}
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          {t('common.retry')}
        </button>
      </div>

      {/* ---- 1. Matching (Eligible) ---- */}
      {matching.length > 0 && (
        <section aria-labelledby="matching-heading">
          <div className="flex items-center gap-2.5 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green shrink-0" />
            <h2 id="matching-heading" className="text-lg font-bold text-navy">
              {t('eligible.criteriaMet')} ({matching.length})
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            {t('eligible.eligibleDisclaimer')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {matching.map((result) => (
              <EligibilityCard key={result.schemeId} result={result} />
            ))}
          </div>
        </section>
      )}

      {/* ---- 2. Needs Verification (Unverified / Insufficient Data) ---- */}
      {unverified.length > 0 && (
        <section aria-labelledby="unverified-heading">
          <div className="flex items-center gap-2.5 mb-2">
            <HelpCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <h2 id="unverified-heading" className="text-lg font-bold text-navy">
              {t('eligible.needsVerificationTitle')} ({unverified.length})
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            {t('eligible.needsVerificationDesc')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {unverified.map((result) => (
              <EligibilityCard key={result.schemeId} result={result} />
            ))}
          </div>
        </section>
      )}

      {/* ---- 3. Not Matching (Ineligible) ---- */}
      {notMatching.length > 0 && (
        <section aria-labelledby="not-matching-heading">
          <div className="flex items-center gap-2.5 mb-2">
            <XCircle className="w-5 h-5 text-muted-foreground shrink-0" />
            <h2 id="not-matching-heading" className="text-lg font-bold text-navy">
              {t('eligible.criteriaNotMet')} ({notMatching.length})
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            {t('eligible.ineligibleDesc')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {notMatching.map((result) => (
              <EligibilityCard key={result.schemeId} result={result} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================================
// EligibilityCard
// ============================================================
function EligibilityCard({ result }: { result: EligibilityResult }) {
  const { t } = useTranslation();
  const { status, schemeName, schemeId, reasons, missingProfileFields } = result;

  const isEligible = status === 'eligible';
  const isUnverified = status === 'unverified';
  const isIneligible = status === 'ineligible';

  let borderStyle = 'border-border opacity-80 hover:opacity-100 bg-card';
  if (isEligible) {
    borderStyle = 'border-green/30 hover:border-green/60 bg-card';
  } else if (isUnverified) {
    borderStyle = 'border-amber-300/60 dark:border-amber-700/50 hover:border-amber-400 bg-card';
  }

  return (
    <Card className={`flex flex-col h-full border rounded-md shadow-none transition-all duration-200 ${borderStyle}`}>
      <CardHeader className="pb-3">
        {/* Status badge */}
        <div className="flex items-center gap-2 mb-3">
          {isEligible && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-green/10 text-green border border-green/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('eligible.matchedBadge')}
            </span>
          )}

          {isUnverified && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              {t('eligible.unverifiedBadge')}
            </span>
          )}

          {isIneligible && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground border border-border">
              <XCircle className="w-3.5 h-3.5" />
              {t('eligible.notMatchedBadge')}
            </span>
          )}
        </div>

        <CardTitle
          className={`text-base leading-snug ${
            isEligible ? 'text-navy' : isUnverified ? 'text-navy dark:text-white' : 'text-muted-foreground'
          }`}
        >
          {schemeName}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {isEligible && (
          <div className="space-y-2">
            <p className="text-sm text-green font-medium">
              {t('eligible.criteriaMet')}
            </p>
            <p className="text-xs text-muted-foreground bg-green/5 border border-green/15 rounded-md p-2.5 leading-relaxed">
              {t('eligible.eligibleDisclaimer')}
            </p>
          </div>
        )}

        {isUnverified && (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
              {t('eligible.criteriaUnverified')}:
            </p>
            <ul className="space-y-1.5">
              {reasons.map((reason, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 rounded-md p-2.5 leading-relaxed">
              {t('eligible.unverifiedDisclaimer')}
            </p>
          </div>
        )}

        {isIneligible && reasons.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t('eligible.criteriaNotMet')}:
            </p>
            <ul className="space-y-1.5">
              {reasons.map((reason, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 border-t border-border/50 mt-auto px-6 py-4 flex items-center justify-between">
        <Link
          to={`/schemes/${schemeId}`}
          className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
        >
          {t('common.viewDetails')}
          <ChevronRight className="w-4 h-4" />
        </Link>

        {isUnverified && missingProfileFields && missingProfileFields.length > 0 && (
          <Link
            to="/profile"
            className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <UserCog className="w-3.5 h-3.5" />
            {t('eligible.completeProfileBtn')}
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

// ============================================================
// StatChip
// ============================================================
function StatChip({
  count,
  label,
  icon,
  color,
}: {
  count: number;
  label: string;
  icon: React.ReactNode;
  color: 'green' | 'amber' | 'muted';
}) {
  let colorClass = 'bg-muted text-muted-foreground border-border';
  if (color === 'green') {
    colorClass = 'bg-green/10 text-green border-green/20';
  } else if (color === 'amber') {
    colorClass = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25';
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-semibold ${colorClass}`}
    >
      {icon}
      <span className="tabular-nums">{count}</span>
      <span>{label}</span>
    </div>
  );
}

// ============================================================
// IncompleteProfileState
// ============================================================
function IncompleteProfileState({
  userName,
  results,
  onRetry,
}: {
  userName?: string;
  results: EligibilityResult[];
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? results : results.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Prompt card */}
      <div className="flex flex-col sm:flex-row items-start gap-5 bg-card border border-border rounded-md p-6">
        <div className="p-3 rounded-md bg-surface-muted text-primary border border-border shrink-0">
          <UserCog className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-navy mb-1">
            {t('eligible.incompleteTitle')}
            {userName ? `, ${userName.split(' ')[0]}` : ''}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {t('eligible.incompleteDesc')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="rounded-md px-6 font-bold text-white bg-primary hover:bg-primary-hover shadow-none"
            >
              <Link to="/profile">
                <UserCog className="w-4 h-4 mr-2" />
                {t('eligible.completeProfileBtn')}
              </Link>
            </Button>
            <Button
              onClick={onRetry}
              variant="outline"
              className="rounded-md px-6 font-bold text-navy border-border"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              {t('common.retry')}
            </Button>
          </div>
        </div>
      </div>

      {/* Collapsed results preview */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-base font-bold text-navy">
            {t('eligible.tabAll')} ({results.length})
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((r) => (
            <EligibilityCard key={r.schemeId} result={r} />
          ))}
        </div>
        {results.length > 3 && !showAll && (
          <div className="mt-6 text-center">
            <Button
              onClick={() => setShowAll(true)}
              variant="outline"
              className="rounded-md font-bold text-navy border-border"
            >
              {t('common.viewDetails')} ({results.length})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LoadingState
// ============================================================
function LoadingState() {
  return (
    <div>
      <div className="flex gap-4 mb-10">
        <div className="h-9 w-44 bg-muted rounded-md animate-pulse" />
        <div className="h-9 w-36 bg-muted rounded-md animate-pulse" />
        <div className="h-9 w-36 bg-muted rounded-md animate-pulse" />
      </div>
      <div className="h-5 w-64 bg-muted rounded animate-pulse mb-5" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-border bg-card p-6 space-y-4 animate-pulse"
          >
            <div className="h-6 w-32 bg-muted rounded-md" />
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
            <div className="pt-4 border-t border-border">
              <div className="h-4 w-28 bg-muted rounded" />
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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-navy mb-2">{t('common.error')}</h2>
      <p className="text-muted-foreground text-sm max-w-md mb-6">{message}</p>
      <Button
        onClick={onRetry}
        variant="outline"
        className="rounded-md px-6 font-bold text-navy border-border"
      >
        <RefreshCcw className="w-4 h-4 mr-2" />
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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-md bg-surface-muted text-muted-foreground border border-border mb-4">
        <SlidersHorizontal className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-navy mb-2">
        {t('eligible.noEligibleTitle')}
      </h2>
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        {t('eligible.noEligibleDesc')}
      </p>
      <Button
        asChild
        className="rounded-md px-6 font-bold text-white bg-primary hover:bg-primary-hover shadow-none"
      >
        <Link to="/schemes">{t('schemes.title')}</Link>
      </Button>
    </div>
  );
}
