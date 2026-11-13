import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  AlertCircle,
  RefreshCcw,
  ExternalLink,
  CheckCircle2,
  FileText,
  ListOrdered,
  ShieldCheck,
  SearchX,
  LayoutGrid,
  ClipboardCheck,
  Info,
  Sparkles,
} from "lucide-react";
import { getSchemeById, NotFoundError } from "@/services/schemeApi";
import { getEligibility } from "@/services/eligibilityApi";
import { createApplication } from "@/services/applicationApi";
import type { Scheme } from "@/types/scheme";
import type { EligibilityResult } from "@/types/eligibility";
import type { UserProfile } from "@/types/user";
import { useAuth } from "@/context/AuthContext";
import { useAiAssistant } from "@/context/AiAssistantContext";
import { extractSchemeHighlights } from "@/utils/schemeHighlights";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/SaveButton";

// ============================================================
// SchemeDetailsPage
// Route: /schemes/:id
// ============================================================

type PageState = "loading" | "not-found" | "error" | "success";

function formatProfileSummary(profile?: UserProfile): string {
  if (!profile) return "";
  const parts: string[] = [];
  if (profile.age !== undefined && profile.age !== null) {
    parts.push(`Age ${profile.age}`);
  }
  if (profile.category) {
    parts.push(profile.category);
  }
  if (profile.gender) {
    parts.push(profile.gender);
  }
  if (profile.state) {
    parts.push(profile.state);
  }
  return parts.join(" • ");
}

export function SchemeDetailsPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { openAssistant } = useAiAssistant();

  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [pageState, setPageState] = useState<PageState>(() => (id ? "loading" : "not-found"));
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  const fetchScheme = useCallback(
    (schemeId: string) => {
      setPageState("loading");
      setScheme(null);
      setEligibilityResult(null);

      getSchemeById(schemeId)
        .then((data) => {
          setScheme(data);
          setPageState("success");
        })
        .catch((err) => {
          if (err instanceof NotFoundError) {
            setPageState("not-found");
          } else {
            setErrorMessage(
              err instanceof Error ? err.message : "An unexpected error occurred."
            );
            setPageState("error");
          }
        });

      if (isAuthenticated) {
        getEligibility()
          .then((results) => {
            const matched = results.find((item) => item.schemeId === schemeId) ?? null;
            setEligibilityResult(matched);
          })
          .catch(() => {
            // Non-blocking: scheme details still render cleanly if eligibility fails
          });
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    if (id) {
      fetchScheme(id);
    }
  }, [id, fetchScheme]);

  const highlights = useMemo(() => {
    return scheme ? extractSchemeHighlights(scheme) : null;
  }, [scheme]);

  const profileSummary = useMemo(
    () => formatProfileSummary(user?.profile),
    [user?.profile]
  );

  const handleTrackApplication = async () => {
    if (!scheme) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/schemes/${scheme._id}` } });
      return;
    }
    if (isTracking) return;
    setIsTracking(true);
    try {
      await createApplication({ schemeId: scheme._id, status: "in-progress" });
    } catch {
      // Gracefully ignore duplicate/non-blocking tracking errors and open tracker
    } finally {
      setIsTracking(false);
      navigate("/applications");
    }
  };

  const handleAskSaathi = () => {
    if (!scheme) return;
    const prompt =
      i18n.language === "hi"
        ? `${scheme.name} के मुख्य लाभ, पात्रता और आवेदन प्रक्रिया बताएं। क्या मैं अपनी प्रोफ़ाइल के अनुसार पात्र हूँ?`
        : `Explain the key benefits, eligibility, and application steps for ${scheme.name}. Based on my profile, am I eligible?`;
    openAssistant(prompt);
  };

  // Loading skeleton matching 2-column layout
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#111110]">
        <div className="bg-white dark:bg-[#1C1B19] border-b border-slate-200 dark:border-[#2E2D2A]">
          <div className="gov-container py-3.5">
            <div className="h-4 w-40 bg-slate-200 dark:bg-[#292826] rounded animate-pulse" />
          </div>
        </div>
        <div className="gov-container py-8 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse">
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="h-6 w-28 bg-slate-200 dark:bg-[#292826] rounded-full" />
                  <div className="h-6 w-24 bg-slate-200 dark:bg-[#292826] rounded-full" />
                </div>
                <div className="h-9 w-3/4 bg-slate-200 dark:bg-[#292826] rounded" />
                <div className="space-y-2 pt-1">
                  <div className="h-4 w-full bg-slate-200 dark:bg-[#292826] rounded" />
                  <div className="h-4 w-5/6 bg-slate-200 dark:bg-[#292826] rounded" />
                </div>
              </div>
              <div className="h-14 w-full bg-slate-200 dark:bg-[#292826] rounded-lg" />
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] p-6 space-y-3"
                >
                  <div className="h-5 w-44 bg-slate-200 dark:bg-[#292826] rounded" />
                  <div className="h-3.5 w-full bg-slate-200 dark:bg-[#292826] rounded" />
                  <div className="h-3.5 w-5/6 bg-slate-200 dark:bg-[#292826] rounded" />
                </div>
              ))}
            </div>
            <div className="lg:col-span-4">
              <div className="rounded-xl border border-slate-200 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] p-6 space-y-4">
                <div className="h-11 w-full bg-slate-200 dark:bg-[#292826] rounded-lg" />
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="h-10 bg-slate-200 dark:bg-[#292826] rounded-lg" />
                  <div className="h-10 bg-slate-200 dark:bg-[#292826] rounded-lg" />
                </div>
                <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-[#2E2D2A]">
                  <div className="h-4 w-full bg-slate-200 dark:bg-[#292826] rounded" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-[#292826] rounded" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-[#292826] rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not-found state — 404 or missing ID
  if (pageState === "not-found") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#111110]">
        <div className="bg-white dark:bg-[#1C1B19] border-b border-slate-200 dark:border-[#2E2D2A]">
          <div className="gov-container py-3.5">
            <Link
              to="/schemes"
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-[#A8A29E] hover:text-[#1E3A8A] dark:hover:text-[#F4F4F0] font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("schemeDetails.backToCatalog")}
            </Link>
          </div>
        </div>

        <div className="gov-container flex flex-col items-center justify-center py-24 text-center gap-5">
          <div className="p-5 rounded-xl bg-white dark:bg-[#1C1B19] text-slate-500 dark:text-[#A8A29E] border border-slate-200 dark:border-[#2E2D2A] shadow-xs">
            <SearchX className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F4F4F0] mb-2">
              {t("schemeDetails.notFoundTitle")}
            </h1>
            <p className="text-slate-600 dark:text-[#A8A29E] text-sm max-w-sm mx-auto">
              {t("schemeDetails.notFoundDesc")}
            </p>
          </div>
          <Button
            asChild
            className="rounded-lg px-6 font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] shadow-none"
          >
            <Link to="/schemes">
              <LayoutGrid className="w-4 h-4" />
              {t("schemes.title")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#111110]">
        <div className="bg-white dark:bg-[#1C1B19] border-b border-slate-200 dark:border-[#2E2D2A]">
          <div className="gov-container py-3.5">
            <Link
              to="/schemes"
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-[#A8A29E] hover:text-[#1E3A8A] dark:hover:text-[#F4F4F0] font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("schemeDetails.backToCatalog")}
            </Link>
          </div>
        </div>

        <div className="gov-container flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#F4F4F0]">
            {t("common.error")}
          </h2>
          <p className="text-slate-600 dark:text-[#A8A29E] text-sm max-w-sm">
            {errorMessage}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button
              onClick={() => id && fetchScheme(id)}
              variant="outline"
              className="flex items-center gap-2 rounded-lg font-semibold text-slate-800 dark:text-[#F4F4F0] border-slate-300 dark:border-[#3A3834]"
            >
              <RefreshCcw className="w-4 h-4" />
              {t("common.retry")}
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-lg font-semibold text-[#1E3A8A] dark:text-[#D95D39]"
            >
              <Link to="/schemes">{t("schemes.title")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!scheme || !highlights) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#111110]">
      {/* ---- Sub-header / Back-bar aligned to 1200px grid ---- */}
      <div className="bg-white dark:bg-[#1C1B19] border-b border-slate-200 dark:border-[#2E2D2A]">
        <div className="gov-container py-3.5">
          <Link
            to="/schemes"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-[#A8A29E] hover:text-[#1E3A8A] dark:hover:text-[#F4F4F0] font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("schemeDetails.backToCatalog")}
          </Link>
        </div>
      </div>

      {/* ---- Main 2-Column Asymmetric Content ---- */}
      <div className="gov-container py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ---- LEFT COLUMN (8/12) ---- */}
          <div className="lg:col-span-8 space-y-6">
            {/* Metadata Badges + Title + Lead Description */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-50 text-blue-800 border border-blue-200 dark:bg-[#292826] dark:text-[#F4F4F0] dark:border-[#3A3834] px-3 py-1 rounded-full text-xs font-semibold">
                  {scheme.category}
                </span>
                <span
                  className={
                    scheme.level === "central"
                      ? "bg-orange-50 text-orange-800 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/50 px-3 py-1 rounded-full text-xs font-semibold"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50 px-3 py-1 rounded-full text-xs font-semibold"
                  }
                >
                  {scheme.level === "central"
                    ? t("schemeDetails.centralBadge")
                    : `${scheme.state ?? t("schemes.state")} ${t("schemes.state")}`}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-slate-900 dark:text-[#F4F4F0] tracking-tight leading-tight">
                {scheme.name}
              </h1>

              <p className="text-slate-600 dark:text-[#A8A29E] text-base leading-relaxed">
                {scheme.description}
              </p>
            </div>

            {/* Contextual Eligibility Strip */}
            <ContextualEligibilityStrip
              eligibilityResult={eligibilityResult}
              profileSummary={profileSummary}
              isAuthenticated={isAuthenticated}
            />

            {/* Information Sections */}
            <div className="space-y-6">
              {scheme.benefits.length > 0 && (
                <section className="bg-white dark:bg-[#1C1B19] border border-slate-200 dark:border-[#2E2D2A] rounded-xl p-6 shadow-xs">
                  <h2 className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-[#F4F4F0] mb-4">
                    <CheckCircle2 className="w-5 h-5 text-[#059669] dark:text-emerald-400 shrink-0" />
                    <span>{t("schemeDetails.benefits")}</span>
                  </h2>

                  {highlights.benefitStats.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-3.5 bg-slate-50 dark:bg-[#141413] rounded-lg border border-slate-200/80 dark:border-[#2E2D2A]">
                      {highlights.benefitStats.map((stat, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#A8A29E]">
                            {stat.label}
                          </div>
                          <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F4F4F0] tabular-nums">
                            {stat.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <ul className="space-y-2.5">
                    {scheme.benefits.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-[#A8A29E] leading-relaxed"
                      >
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#059669] dark:bg-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {scheme.eligibility.length > 0 && (
                <InfoSection
                  icon={
                    <ShieldCheck className="w-5 h-5 text-[#1E3A8A] dark:text-[#D95D39] shrink-0" />
                  }
                  title={t("schemeDetails.eligibilityCriteria")}
                  items={scheme.eligibility}
                  dotColor="bg-[#1E3A8A] dark:bg-[#D95D39]"
                />
              )}

              {scheme.requiredDocuments.length > 0 && (
                <InfoSection
                  icon={
                    <FileText className="w-5 h-5 text-[#EA580C] shrink-0" />
                  }
                  title={t("schemeDetails.documentsRequired")}
                  items={scheme.requiredDocuments}
                  dotColor="bg-[#EA580C]"
                />
              )}

              {scheme.applicationProcess.length > 0 && (
                <StepsSection
                  icon={
                    <ListOrdered className="w-5 h-5 text-slate-800 dark:text-[#F4F4F0] shrink-0" />
                  }
                  title={t("home.howItWorks.step3.title")}
                  items={scheme.applicationProcess}
                />
              )}
            </div>

            {/* Source Attribution & Official Link Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-[#2E2D2A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-slate-500 dark:text-[#A8A29E]">
                <span className="font-semibold text-slate-700 dark:text-[#F4F4F0]">
                  Source:
                </span>{" "}
                {scheme.source}
              </p>
              {scheme.officialUrl && (
                <a
                  href={scheme.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#1E3A8A] dark:text-[#D95D39] font-semibold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t("common.officialSource")}
                </a>
              )}
            </div>
          </div>

          {/* ---- RIGHT STICKY SIDEBAR (4/12) ---- */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-[#1C1B19] border border-slate-200 dark:border-[#2E2D2A] rounded-xl p-6 shadow-xs">
              {/* Action Buttons Stack */}
              <div className="flex flex-col gap-3">
                {scheme.officialUrl && (
                  <a
                    href={scheme.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 h-11 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] text-white font-semibold text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span>{t("schemeDetails.applyNow")}</span>
                  </a>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <SaveButton
                    schemeId={scheme._id}
                    schemeName={scheme.name}
                    variant="button"
                    className="w-full justify-center h-auto min-h-10 py-2 px-2.5 rounded-lg text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-[#3A3834] dark:text-[#F4F4F0] dark:bg-transparent dark:hover:bg-[#292826] whitespace-normal xl:whitespace-nowrap text-center leading-tight"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isTracking}
                    onClick={handleTrackApplication}
                    className="w-full justify-center h-auto min-h-10 py-2 px-2.5 rounded-lg text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-[#3A3834] dark:text-[#F4F4F0] dark:bg-transparent dark:hover:bg-[#292826] gap-1.5 shadow-none whitespace-normal xl:whitespace-nowrap text-center leading-tight cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-[#D95D39] shrink-0" />
                    <span>
                      {isTracking ? t("common.loading", "Saving...") : t("schemeDetails.trackApplication")}
                    </span>
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAskSaathi}
                  className="w-full justify-center h-10 px-3 rounded-lg text-xs sm:text-sm font-semibold border-[#1E3A8A]/30 text-[#1E3A8A] hover:bg-[#1E3A8A]/5 dark:border-[#D95D39]/40 dark:text-[#D95D39] dark:hover:bg-[#D95D39]/10 gap-2 shadow-none cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    {i18n.language === "hi"
                      ? "इस योजना के बारे में साथी से पूछें"
                      : "Ask Saathi About This Scheme"}
                  </span>
                </Button>
              </div>

              {/* Quick Overview Key-Value List */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-[#2E2D2A]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#A8A29E] mb-2">
                  {t("schemeDetails.quickOverview", "Quick Overview")}
                </h3>
                <dl>
                  {highlights.quickOverview.map((row, idx) => (
                    <div
                      key={row.defaultLabel}
                      className={`py-2.5 text-sm flex items-start justify-between gap-4 ${
                        idx < highlights.quickOverview.length - 1
                          ? "border-b border-dashed border-slate-200 dark:border-[#2E2D2A]"
                          : ""
                      }`}
                    >
                      <dt className="text-slate-500 dark:text-[#A8A29E] shrink-0">
                        {t(row.labelKey, row.defaultLabel)}
                      </dt>
                      <dd className="font-semibold text-slate-900 dark:text-[#F4F4F0] text-right">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// ContextualEligibilityStrip
// ------------------------------------------------------------------
function ContextualEligibilityStrip({
  eligibilityResult,
  profileSummary,
  isAuthenticated,
}: {
  eligibilityResult: EligibilityResult | null;
  profileSummary: string;
  isAuthenticated: boolean;
}) {
  const { t, i18n } = useTranslation();
  const isHi = i18n.language === "hi";

  if (eligibilityResult?.status === "eligible") {
    return (
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3.5 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-[#059669] dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[11px] font-semibold px-2 py-0.5 border-0">
                {isHi ? "पात्र" : "Eligible"}
              </Badge>
              <span className="font-semibold">
                {isHi
                  ? "आप इस योजना के सत्यापित पात्रता मानदंडों को पूरा करते हैं।"
                  : "You match the verified eligibility criteria for this scheme."}
              </span>
            </div>
            {profileSummary && (
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                {t("schemeDetails.yourProfileLabel")}: {profileSummary}
              </p>
            )}
          </div>
        </div>
        <Link
          to="/eligible"
          className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline shrink-0 whitespace-nowrap"
        >
          {t("schemeDetails.viewEligibility")} →
        </Link>
      </div>
    );
  }

  if (eligibilityResult?.status === "ineligible") {
    const mismatchItems = eligibilityResult.reasons || [];
    const missingFields = eligibilityResult.missingProfileFields || [];

    return (
      <div className="bg-red-50/80 border border-red-200 rounded-lg p-3.5 text-sm text-red-950 dark:bg-red-950/25 dark:border-red-900/50 dark:text-red-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-red-600 text-white hover:bg-red-600 text-[11px] font-semibold px-2 py-0.5 border-0">
                {isHi ? "अपत्र" : "Ineligible"}
              </Badge>
              <span className="font-semibold">
                {t("schemeDetails.eligibilityMatchTitle")}
              </span>
            </div>
            {mismatchItems.length > 0 && (
              <ul className="list-disc pl-4 space-y-0.5 text-xs text-red-900/90 dark:text-red-200/90">
                {mismatchItems.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            )}
            {missingFields.length > 0 && (
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {isHi ? "अनुपलब्ध फ़ील्ड:" : "Missing fields:"} {missingFields.join(", ")}
              </p>
            )}
            {profileSummary && (
              <p className="text-xs text-red-900/75 dark:text-red-300/80">
                {t("schemeDetails.yourProfileLabel")}: {profileSummary}
              </p>
            )}
          </div>
        </div>
        <Link
          to="/profile"
          className="text-xs font-semibold text-red-900 dark:text-red-300 hover:underline shrink-0 whitespace-nowrap"
        >
          {t("schemeDetails.updateProfile")} →
        </Link>
      </div>
    );
  }

  if (eligibilityResult?.status === "unverified") {
    const missing = eligibilityResult.missingProfileFields || [];
    const reasons = eligibilityResult.reasons || [];

    return (
      <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5 text-sm text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-600 text-white hover:bg-amber-600 text-[11px] font-semibold px-2 py-0.5 border-0">
                {isHi ? "सत्यापन अपूर्ण" : "Unverified Profile"}
              </Badge>
              <span className="font-semibold">
                {missing.length > 0
                  ? t("schemeDetails.profileMissingFields", { fields: missing.join(", ") })
                  : t("schemeDetails.eligibilityMatchTitle")}
              </span>
            </div>
            {reasons.length > 0 && (
              <ul className="list-disc pl-4 space-y-0.5 text-xs text-amber-900/90 dark:text-amber-200/90">
                {reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            )}
            {profileSummary && (
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                {t("schemeDetails.yourProfileLabel")}: {profileSummary}
              </p>
            )}
          </div>
        </div>
        <Link
          to="/profile"
          className="text-xs font-semibold text-amber-900 dark:text-amber-300 hover:underline shrink-0 whitespace-nowrap"
        >
          {t("schemeDetails.updateProfile")} →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5 text-sm text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start sm:items-center gap-3">
        <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
        <span>
          {profileSummary
            ? `${t("schemeDetails.yourProfileLabel")}: ${profileSummary}`
            : t("schemeDetails.profileIncompleteNotice")}
        </span>
      </div>
      <Link
        to={!isAuthenticated ? "/login" : profileSummary ? "/eligible" : "/profile"}
        className="text-xs font-semibold text-amber-900 dark:text-amber-300 hover:underline shrink-0 whitespace-nowrap"
      >
        {!isAuthenticated
          ? t("nav.login", "Sign In")
          : profileSummary
            ? t("schemeDetails.viewEligibility")
            : t("schemeDetails.updateProfile")}{" "}
        →
      </Link>
    </div>
  );
}

// ------------------------------------------------------------------
// InfoSection
// ------------------------------------------------------------------
interface SectionProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
  dotColor: string;
}

function InfoSection({ icon, title, items, dotColor }: SectionProps) {
  return (
    <section className="bg-white dark:bg-[#1C1B19] border border-slate-200 dark:border-[#2E2D2A] rounded-xl p-6 shadow-xs">
      <h2 className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-[#F4F4F0] mb-4">
        {icon}
        <span>{title}</span>
      </h2>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-[#A8A29E] leading-relaxed"
          >
            <span className={`mt-2 h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------------
// StepsSection
// ------------------------------------------------------------------
interface StepsSectionProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
}

function StepsSection({ icon, title, items }: StepsSectionProps) {
  return (
    <section className="bg-white dark:bg-[#1C1B19] border border-slate-200 dark:border-[#2E2D2A] rounded-xl p-6 shadow-xs">
      <h2 className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-[#F4F4F0] mb-4">
        {icon}
        <span>{title}</span>
      </h2>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-sm text-slate-600 dark:text-[#A8A29E] leading-relaxed"
          >
            <span className="flex-shrink-0 h-5 w-5 rounded-md bg-slate-100 dark:bg-[#292826] text-[#1E3A8A] dark:text-[#F4F4F0] font-bold text-xs flex items-center justify-center mt-0.5 border border-slate-200 dark:border-[#3A3834]">
              {i + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
