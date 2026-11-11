import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ClipboardCheck,
  Search,
  Calendar,
  FileText,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  RefreshCcw,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  Bookmark,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  ShieldAlert,
  ArrowRight,
  Plus,
} from "lucide-react";
import {
  getApplications,
  updateApplication,
  deleteApplication,
  AuthError,
} from "@/services/applicationApi";
import type { ApplicationItem, ApplicationStatus } from "@/types/application";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ============================================================
// Status Styling Configurations
// ============================================================

const STATUS_META: Record<
  ApplicationStatus,
  {
    icon: typeof Clock;
    badgeClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  saved: {
    icon: Bookmark,
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    textClass: "text-amber-600 dark:text-amber-400",
    borderClass: "border-amber-500/30",
  },
  "in-progress": {
    icon: Clock,
    badgeClass: "bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/20",
    textClass: "text-stone-600 dark:text-stone-300",
    borderClass: "border-stone-500/30",
  },
  submitted: {
    icon: Send,
    badgeClass: "bg-[#D95D39]/10 text-[#D95D39] border-[#D95D39]/20",
    textClass: "text-[#D95D39]",
    borderClass: "border-[#D95D39]/30",
  },
  approved: {
    icon: CheckCircle2,
    badgeClass: "bg-green/10 text-green border-green/20",
    textClass: "text-green",
    borderClass: "border-green/30",
  },
  rejected: {
    icon: XCircle,
    badgeClass: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    textClass: "text-red-600 dark:text-red-400",
    borderClass: "border-red-500/30",
  },
};

const ALL_STATUSES: ApplicationStatus[] = [
  "saved",
  "in-progress",
  "submitted",
  "approved",
  "rejected",
];

// ============================================================
// ApplicationsPage
// Route: /applications (Protected)
// ============================================================

export function ApplicationsPage() {
  const { t } = useTranslation();

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Edit states for individual items
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>("");
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [dateDraft, setDateDraft] = useState<string>("");

  // Operation state indicators
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getApplications();
      setApplications(data);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(t('auth.login.invalidCredentials'));
      } else {
        const msg = err instanceof Error ? err.message : t('common.error');
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  function getStatusLabel(status: ApplicationStatus) {
    switch (status) {
      case "saved":
        return t('tracker.status.saved');
      case "in-progress":
        return t('tracker.status.inProgress');
      case "submitted":
        return t('tracker.status.submitted');
      case "approved":
        return t('tracker.status.approved');
      case "rejected":
        return t('tracker.status.rejected');
      default:
        return status;
    }
  }

  // Handle status update
  async function handleStatusChange(applicationId: string, newStatus: ApplicationStatus) {
    setProcessingId(applicationId);
    try {
      const updated = await updateApplication(applicationId, { status: newStatus });
      setApplications((prev) =>
        prev.map((app) => (app._id === applicationId ? updated : app))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setProcessingId(null);
    }
  }

  // Handle notes save
  async function handleSaveNotes(applicationId: string) {
    setProcessingId(applicationId);
    try {
      const updated = await updateApplication(applicationId, { notes: notesDraft });
      setApplications((prev) =>
        prev.map((app) => (app._id === applicationId ? updated : app))
      );
      setEditingNotesId(null);
    } catch (err) {
      console.error("Failed to update notes:", err);
    } finally {
      setProcessingId(null);
    }
  }

  // Handle application date save
  async function handleSaveDate(applicationId: string) {
    if (!dateDraft) return;
    setProcessingId(applicationId);
    try {
      const parsedDate = new Date(dateDraft).toISOString();
      const updated = await updateApplication(applicationId, { appliedAt: parsedDate });
      setApplications((prev) =>
        prev.map((app) => (app._id === applicationId ? updated : app))
      );
      setEditingDateId(null);
    } catch (err) {
      console.error("Failed to update date:", err);
    } finally {
      setProcessingId(null);
    }
  }

  // Handle delete
  async function handleDelete(applicationId: string) {
    if (!window.confirm(t('tracker.deleteConfirm'))) {
      return;
    }
    setProcessingId(applicationId);
    try {
      await deleteApplication(applicationId);
      setApplications((prev) => prev.filter((app) => app._id !== applicationId));
    } catch (err) {
      console.error("Failed to delete application:", err);
    } finally {
      setProcessingId(null);
    }
  }

  // --- Computed Metrics & Filtering ---
  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = { all: applications.length };
    for (const app of applications) {
      counts[app.status] = (counts[app.status] || 0) + 1;
    }
    return counts;
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // 1. Status Filter
      if (selectedStatusTab !== "all" && app.status !== selectedStatusTab) {
        return false;
      }

      // 2. Search Keyword
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const schemeName = app.scheme?.name?.toLowerCase() || "";
        const category = app.scheme?.category?.toLowerCase() || "";
        const notes = app.notes?.toLowerCase() || "";
        if (!schemeName.includes(query) && !category.includes(query) && !notes.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [applications, selectedStatusTab, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* ===== PAGE HEADER ===== */}
      <section className="border-b border-border bg-surface">
        <div className="gov-container py-10 md:py-14">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 dark:bg-[#292826] dark:text-[#F4F4F0] text-xs font-bold tracking-widest uppercase border border-stone-200 dark:border-[#3A3834] mb-4">
            <ClipboardCheck className="w-3.5 h-3.5" />
            {t('nav.tracker')}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight mb-3">
            {t('tracker.title')}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base leading-relaxed">
            {t('tracker.subtitle')}
          </p>

          {/* Citizen Portal Reminder Notice */}
          <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3 max-w-3xl">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-navy font-semibold">{t('common.disclaimer')}</strong>
            </p>
          </div>
        </div>
      </section>

      <div className="gov-container py-8 space-y-6">
        {/* ===== CONTROLS & STATUS TABS ===== */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {/* Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              <button
                type="button"
                onClick={() => setSelectedStatusTab("all")}
                className={`shrink-0 text-xs px-3.5 py-2 rounded-md font-bold transition-all border ${
                  selectedStatusTab === "all"
                    ? "bg-stone-900 text-white border-stone-900 dark:bg-[#292826] dark:text-[#F4F4F0] dark:border-[#D95D39] shadow-none"
                    : "bg-surface text-muted-foreground border-border hover:text-navy hover:bg-surface-muted"
                }`}
              >
                {t('tracker.allStatuses')} ({countsByStatus.all || 0})
              </button>

              {ALL_STATUSES.map((statusKey) => {
                const config = STATUS_META[statusKey];
                const count = countsByStatus[statusKey] || 0;
                const isSelected = selectedStatusTab === statusKey;
                const label = getStatusLabel(statusKey);

                return (
                  <button
                    key={statusKey}
                    type="button"
                    onClick={() => setSelectedStatusTab(statusKey)}
                    className={`shrink-0 text-xs px-3 py-2 rounded-md font-bold transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? `${config.badgeClass} font-extrabold border-current shadow-none`
                        : "bg-surface text-muted-foreground border-border hover:text-navy hover:bg-surface-muted"
                    }`}
                  >
                    <span>{label}</span>
                    <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-black/10 dark:bg-white/10">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <Button
                asChild
                variant="outline"
                className="h-11 rounded-md border-border text-navy font-bold gap-2 shrink-0 shadow-none"
              >
                <Link to="/schemes">
                  <Plus className="w-4 h-4" />
                  <span>{t('tracker.exploreSchemes')}</span>
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* ===== LOADING STATE ===== */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="border-border bg-surface p-6 animate-pulse space-y-4">
                <div className="h-4 bg-surface-muted rounded w-1/3" />
                <div className="h-6 bg-surface-muted rounded w-3/4" />
                <div className="h-16 bg-surface-muted rounded w-full" />
                <div className="h-10 bg-surface-muted rounded w-full" />
              </Card>
            ))}
          </div>
        )}

        {/* ===== ERROR STATE ===== */}
        {!isLoading && error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-8 text-center max-w-xl mx-auto space-y-4">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
            <h3 className="text-lg font-bold text-destructive">{t('common.error')}</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              onClick={loadApplications}
              variant="outline"
              className="rounded-md border-border font-bold gap-2 text-navy"
            >
              <RefreshCcw className="w-4 h-4" />
              {t('common.retry')}
            </Button>
          </div>
        )}

        {/* ===== EMPTY STATE ===== */}
        {!isLoading && !error && applications.length === 0 && (
          <div className="rounded-md border border-border bg-surface p-12 text-center max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-md bg-surface-muted text-primary border border-border mx-auto flex items-center justify-center">
              <ClipboardCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy mb-2">{t('tracker.emptyTitle')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('tracker.emptyDesc')}
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <Button asChild className="rounded-md px-6 font-bold bg-primary hover:bg-primary-hover text-white shadow-none">
                <Link to="/schemes" className="flex items-center gap-2">
                  {t('tracker.exploreSchemes')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* ===== FILTER EMPTY STATE ===== */}
        {!isLoading && !error && applications.length > 0 && filteredApplications.length === 0 && (
          <div className="rounded-md border border-border bg-surface p-8 text-center max-w-md mx-auto space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('schemes.noResultsDesc')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStatusTab("all");
                setSearchQuery("");
              }}
              className="rounded-md text-xs font-bold"
            >
              {t('common.reset')}
            </Button>
          </div>
        )}

        {/* ===== APPLICATIONS LIST / GRID ===== */}
        {!isLoading && !error && filteredApplications.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredApplications.map((app) => {
              const scheme = app.scheme;
              if (!scheme) return null;

              const statusMeta = STATUS_META[app.status] || STATUS_META.saved;
              const StatusIcon = statusMeta.icon;
              const isBusy = processingId === app._id;
              const isEditingNotes = editingNotesId === app._id;
              const isEditingDate = editingDateId === app._id;

              const dateObj = new Date(app.appliedAt);
              const formattedDate = !isNaN(dateObj.getTime())
                ? dateObj.toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : t('common.notAvailable');

              return (
                <Card
                  key={app._id}
                  className={`border-border bg-surface shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${statusMeta.borderClass}`}
                >
                  <CardHeader className="pb-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs font-semibold border-border">
                          {scheme.category}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs uppercase tracking-wider font-semibold text-muted-foreground"
                        >
                          {scheme.level === "central" ? t('schemes.central') : scheme.state || t('schemes.state')}
                        </Badge>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(app._id)}
                        disabled={isBusy}
                        title={t('common.remove')}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <CardTitle className="text-lg font-bold text-navy leading-snug">
                      <Link
                        to={`/schemes/${scheme._id}`}
                        className="hover:text-primary transition-colors flex items-center gap-1 group"
                      >
                        <span>{scheme.name}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4 pb-4">
                    {/* Status Changer Control */}
                    <div className="p-3.5 rounded-md bg-surface-muted border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md bg-surface border border-border/50 ${statusMeta.textClass}`}>
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('tracker.currentStatus')}
                          </span>
                          <span className={`text-sm font-bold ${statusMeta.textClass}`}>
                            {getStatusLabel(app.status)}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown status updater */}
                      <div className="flex items-center gap-2">
                        <select
                          value={app.status}
                          disabled={isBusy}
                          onChange={(e) =>
                            handleStatusChange(app._id, e.target.value as ApplicationStatus)
                          }
                          aria-label={`Change status for ${scheme.name}`}
                          className="h-9 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-navy shadow-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {ALL_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {getStatusLabel(st)}
                            </option>
                          ))}
                        </select>
                        {isBusy && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      </div>
                    </div>

                    {/* Milestone / Application Date Section */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{t('tracker.appliedDate')}:</span>
                        {isEditingDate ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              value={dateDraft}
                              onChange={(e) => setDateDraft(e.target.value)}
                              className="h-7 text-xs px-2 rounded border border-border bg-surface text-foreground"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveDate(app._id)}
                              disabled={isBusy || !dateDraft}
                              aria-label="Save date"
                              className="text-green hover:opacity-80 p-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingDateId(null)}
                              aria-label="Cancel date edit"
                              className="text-muted-foreground hover:text-foreground p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-foreground">{formattedDate}</span>
                        )}
                      </div>

                      {!isEditingDate && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDateId(app._id);
                            try {
                              const d = new Date(app.appliedAt);
                              setDateDraft(d.toISOString().split("T")[0]);
                            } catch {
                              setDateDraft("");
                            }
                          }}
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          {t('common.reset')}
                        </button>
                      )}
                    </div>

                    {/* Personal Notes Section */}
                    <div className="space-y-2 pt-1 border-t border-border/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-navy flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                          {t('tracker.notes')}
                        </span>
                        {!isEditingNotes && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNotesId(app._id);
                              setNotesDraft(app.notes || "");
                            }}
                            className="text-primary hover:underline font-semibold flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{app.notes ? t('common.reset') : `+ ${t('tracker.notes')}`}</span>
                          </button>
                        )}
                      </div>

                      {isEditingNotes ? (
                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            placeholder={t('tracker.notesPlaceholder')}
                            className="w-full text-xs p-2.5 rounded-lg border border-border bg-surface text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingNotesId(null);
                                setNotesDraft("");
                              }}
                              className="h-7 px-2.5 text-xs font-semibold"
                            >
                              {t('common.cancel')}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSaveNotes(app._id)}
                              disabled={isBusy}
                              className="h-7 px-3 text-xs font-bold bg-primary text-white"
                            >
                              {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : t('common.saveChanges')}
                            </Button>
                          </div>
                        </div>
                      ) : app.notes ? (
                        <div className="p-3 rounded-lg bg-surface-muted text-xs text-foreground leading-relaxed whitespace-pre-wrap border border-border/40 font-sans">
                          {app.notes}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          {t('tracker.notesPlaceholder')}
                        </p>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <Button asChild variant="outline" size="sm" className="rounded-md font-bold text-navy h-8 shadow-none">
                      <Link to={`/schemes/${scheme._id}`}>
                        {t('common.viewDetails')}
                      </Link>
                    </Button>

                    {scheme.officialUrl && (
                      <a
                        href={scheme.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                      >
                        <span>{t('common.officialSource')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
