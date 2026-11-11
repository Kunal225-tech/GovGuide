import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
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
} from "lucide-react";
import { getSchemeById, NotFoundError } from "@/services/schemeApi";
import type { Scheme } from "@/types/scheme";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/SaveButton";

// ============================================================
// SchemeDetailsPage
// Route: /schemes/:id
// ============================================================

type PageState = "loading" | "not-found" | "error" | "success";

export function SchemeDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [pageState, setPageState] = useState<PageState>(() => (id ? "loading" : "not-found"));
  const [errorMessage, setErrorMessage] = useState<string>("");

  const fetchScheme = useCallback((schemeId: string) => {
    setPageState("loading");
    setScheme(null);

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
  }, []);

  useEffect(() => {
    if (id) {
      fetchScheme(id);
    }
  }, [id, fetchScheme]);

  // Loading skeleton
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-surface">
          <div className="gov-container py-4">
            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="gov-container py-10">
          <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-muted rounded-md" />
              <div className="h-6 w-20 bg-muted rounded-md" />
            </div>
            <div className="h-9 w-2/3 bg-muted rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-5/6 bg-muted rounded" />
              <div className="h-4 w-4/6 bg-muted rounded" />
            </div>
            <div className="h-10 w-52 bg-muted rounded-md" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-md border border-border bg-card p-6 space-y-3">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-5/6 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not-found state — 404 or missing ID
  if (pageState === "not-found") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-surface">
          <div className="gov-container py-4">
            <Link
              to="/schemes"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('schemeDetails.backToCatalog')}
            </Link>
          </div>
        </div>

        <div className="gov-container flex flex-col items-center justify-center py-24 text-center gap-5">
          <div className="p-5 rounded-md bg-surface-muted text-muted-foreground border border-border">
            <SearchX className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy mb-2">{t('schemeDetails.notFoundTitle')}</h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {t('schemeDetails.notFoundDesc')}
            </p>
          </div>
          <Button
            asChild
            className="rounded-md px-6 font-bold text-white bg-primary hover:bg-primary-hover shadow-none"
          >
            <Link to="/schemes">
              <LayoutGrid className="w-4 h-4" />
              {t('schemes.title')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-surface">
          <div className="gov-container py-4">
            <Link
              to="/schemes"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('schemeDetails.backToCatalog')}
            </Link>
          </div>
        </div>

        <div className="gov-container flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-navy">{t('common.error')}</h2>
          <p className="text-muted-foreground text-sm max-w-sm">{errorMessage}</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button
              onClick={() => id && fetchScheme(id)}
              variant="outline"
              className="flex items-center gap-2 rounded-md font-bold text-navy border-border"
            >
              <RefreshCcw className="w-4 h-4" />
              {t('common.retry')}
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-md font-bold text-primary"
            >
              <Link to="/schemes">{t('schemes.title')}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!scheme) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* ---- Breadcrumb bar ---- */}
      <div className="border-b border-border bg-surface">
        <div className="gov-container py-4">
          <Link
            to="/schemes"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('schemeDetails.backToCatalog')}
          </Link>
        </div>
      </div>

      <div className="gov-container py-10">
        <div className="max-w-3xl mx-auto">

          {/* ---- Category + Level badges ---- */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary font-semibold rounded-md border-0"
            >
              {scheme.category}
            </Badge>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                scheme.level === "central"
                  ? "bg-saffron/10 text-saffron border-saffron/20"
                  : "bg-green/10 text-green border-green/20"
              }`}
            >
              {scheme.level === "central"
                ? t('schemeDetails.centralBadge')
                : `${scheme.state ?? t('schemes.state')} ${t('schemes.state')}`}
            </span>
          </div>

          {/* ---- Scheme name ---- */}
          <h1 className="text-3xl md:text-4xl font-bold text-navy leading-snug mb-4">
            {scheme.name}
          </h1>

          {/* ---- Description ---- */}
          <p className="text-muted-foreground text-base leading-relaxed mb-8">
            {scheme.description}
          </p>

          {/* ---- PROMINENT Actions: Official Website CTA + Save Scheme Button + Tracker ---- */}
          <div className="flex flex-wrap items-center gap-3 mb-10">
            {scheme.officialUrl && (
              <a
                href={scheme.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 h-11 rounded-md bg-primary text-primary-foreground font-bold text-sm shadow-none hover:bg-primary-hover transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t('schemeDetails.applyNow')}
              </a>
            )}

            <SaveButton
              schemeId={scheme._id}
              schemeName={scheme.name}
              variant="button"
            />

            <Button
              asChild
              variant="outline"
              className="rounded-md font-bold px-5 h-11 border-border text-navy gap-2 shadow-none"
            >
              <Link to="/applications">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                <span>{t('schemeDetails.trackApplication')}</span>
              </Link>
            </Button>
          </div>

          {/* ---- Information sections ---- */}
          <div className="space-y-5">

            {scheme.benefits.length > 0 && (
              <InfoSection
                icon={<CheckCircle2 className="w-5 h-5 text-green" />}
                title={t('schemeDetails.benefits')}
                items={scheme.benefits}
                dotColor="bg-green"
              />
            )}

            {scheme.eligibility.length > 0 && (
              <InfoSection
                icon={<ShieldCheck className="w-5 h-5 text-primary" />}
                title={t('schemeDetails.eligibilityCriteria')}
                items={scheme.eligibility}
                dotColor="bg-primary"
              />
            )}

            {scheme.requiredDocuments.length > 0 && (
              <InfoSection
                icon={<FileText className="w-5 h-5 text-saffron" />}
                title={t('schemeDetails.documentsRequired')}
                items={scheme.requiredDocuments}
                dotColor="bg-saffron"
              />
            )}

            {scheme.applicationProcess.length > 0 && (
              <StepsSection
                icon={<ListOrdered className="w-5 h-5 text-navy dark:text-white" />}
                title={t('home.howItWorks.step3.title')}
                items={scheme.applicationProcess}
              />
            )}
          </div>

          {/* ---- Source attribution & official link disclaimer ---- */}
          <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Source:</span> {scheme.source}
            </p>
            {scheme.officialUrl && (
              <a
                href={scheme.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t('common.officialSource')}
              </a>
            )}
          </div>
        </div>
      </div>
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
    <Card className="p-6 border-border/60 bg-card">
      <h2 className="flex items-center gap-2.5 text-base font-bold text-navy mb-4">
        {icon}
        {title}
      </h2>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </Card>
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
    <Card className="p-6 border-border/60 bg-card">
      <h2 className="flex items-center gap-2.5 text-base font-bold text-navy mb-4">
        {icon}
        {title}
      </h2>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
            <span className="flex-shrink-0 h-5 w-5 rounded-md bg-primary/10 text-primary font-bold text-xs flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </Card>
  );
}
