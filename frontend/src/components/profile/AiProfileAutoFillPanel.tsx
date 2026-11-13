import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Check,
  X,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  extractProfileWithAi,
  type ExtractedProfile,
  type ProfileExtractResponse,
} from "@/services/aiApi";
import type { ProfileFormFields } from "@/types/user";

interface AiProfileAutoFillPanelProps {
  currentForm: ProfileFormFields;
  completionPercentage: number;
  onApplyFields: (fields: Partial<ProfileFormFields>) => void;
}

interface FieldDescriptor {
  key: keyof ProfileFormFields;
  labelKey: string;
  defaultLabel: string;
  formatValue?: (val: string) => string;
}

const FIELD_DESCRIPTORS: FieldDescriptor[] = [
  { key: "age", labelKey: "profile.age", defaultLabel: "Age (years)" },
  { key: "gender", labelKey: "profile.gender", defaultLabel: "Gender" },
  { key: "state", labelKey: "profile.state", defaultLabel: "State" },
  { key: "district", labelKey: "profile.district", defaultLabel: "District" },
  {
    key: "annualIncome",
    labelKey: "profile.annualIncome",
    defaultLabel: "Annual Household Income (INR)",
    formatValue: (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? `₹${n.toLocaleString("en-IN")}` : v;
    },
  },
  { key: "occupation", labelKey: "profile.employmentStatus", defaultLabel: "Employment Status" },
  {
    key: "education",
    labelKey: "profile.highestEducation",
    defaultLabel: "Highest Education",
  },
  { key: "category", labelKey: "profile.casteCategory", defaultLabel: "Social Category" },
];

type DiffKind = "new" | "replaces" | "matches";

interface CandidateRow {
  key: keyof ProfileFormFields;
  labelKey: string;
  defaultLabel: string;
  rawValue: string;
  displayValue: string;
  currentDisplayValue: string;
  diffKind: DiffKind;
}

function formatFieldDisplay(desc: FieldDescriptor, raw: string): string {
  if (!raw) return "";
  return desc.formatValue ? desc.formatValue(raw) : raw;
}

function buildCandidateRows(
  extracted: ExtractedProfile,
  currentForm: ProfileFormFields
): CandidateRow[] {
  const rows: CandidateRow[] = [];

  for (const desc of FIELD_DESCRIPTORS) {
    const rawCandidate = extracted[desc.key];
    if (rawCandidate === null || rawCandidate === undefined) continue;

    const rawValue = String(rawCandidate).trim();
    if (!rawValue) continue;

    // ProfilePage currently scopes the State dropdown strictly to Bihar
    if (desc.key === "state" && rawValue !== "Bihar") continue;

    const currentValue = currentForm[desc.key] ?? "";
    const diffKind: DiffKind = !currentValue
      ? "new"
      : currentValue === rawValue
        ? "matches"
        : "replaces";

    rows.push({
      key: desc.key,
      labelKey: desc.labelKey,
      defaultLabel: desc.defaultLabel,
      rawValue,
      displayValue: formatFieldDisplay(desc, rawValue),
      currentDisplayValue: formatFieldDisplay(desc, currentValue),
      diffKind,
    });
  }

  return rows;
}

const EXAMPLE_KEYS = ["student", "farmer", "entrepreneur"] as const;

export function AiProfileAutoFillPanel({
  currentForm,
  completionPercentage,
  onApplyFields,
}: AiProfileAutoFillPanelProps) {
  const { t, i18n } = useTranslation();
  const lang: "en" | "hi" = i18n.language?.toLowerCase().startsWith("hi")
    ? "hi"
    : "en";

  const [isOpen, setIsOpen] = useState<boolean>(() => completionPercentage < 50);
  const [inputText, setInputText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ProfileExtractResponse | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<
    Record<string, boolean>
  >({});

  const candidateRows = useMemo(() => {
    if (!result) return [];
    return buildCandidateRows(result.profile, currentForm);
  }, [result, currentForm]);

  const nonBiharState = useMemo(() => {
    const stateVal = result?.profile?.state?.trim();
    return stateVal && stateVal !== "Bihar" ? stateVal : null;
  }, [result]);

  const selectedApplyCount = useMemo(
    () =>
      candidateRows.filter(
        (row) => row.diffKind !== "matches" && selectedKeys[row.key]
      ).length,
    [candidateRows, selectedKeys]
  );

  const missingFieldLabels = useMemo(() => {
    const missing = result?.profile?.missing_fields ?? [];
    return missing
      .map((fieldKey) => {
        const desc = FIELD_DESCRIPTORS.find((d) => d.key === fieldKey);
        return desc ? t(desc.labelKey, desc.defaultLabel) : null;
      })
      .filter((label): label is string => Boolean(label));
  }, [result, t]);

  async function handleExtract() {
    const trimmed = inputText.trim();
    if (trimmed.length < 3) {
      setErrorMsg(
        t(
          "profile.aiAutoFill.tooShortError",
          "Please write at least a short sentence describing yourself."
        )
      );
      return;
    }

    setExtracting(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const response = await extractProfileWithAi(trimmed, lang);
      const rows = buildCandidateRows(response.profile, currentForm);

      const initialSelection: Record<string, boolean> = {};
      for (const row of rows) {
        if (row.diffKind !== "matches") {
          initialSelection[row.key] = true;
        }
      }

      setSelectedKeys(initialSelection);
      setResult(response);
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : t(
              "profile.aiAutoFill.extractError",
              "Could not extract details right now. Please try again or fill the form below."
            );
      setErrorMsg(message);
    } finally {
      setExtracting(false);
    }
  }

  function handleToggleKey(key: keyof ProfileFormFields) {
    setSelectedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function handleApplySelected() {
    const fieldsToApply: Partial<ProfileFormFields> = {};
    for (const row of candidateRows) {
      if (row.diffKind !== "matches" && selectedKeys[row.key]) {
        fieldsToApply[row.key] = row.rawValue;
      }
    }

    if (Object.keys(fieldsToApply).length === 0) return;

    onApplyFields(fieldsToApply);
    setResult(null);
    setSelectedKeys({});
    setErrorMsg(null);
  }

  function handleDiscard() {
    setResult(null);
    setSelectedKeys({});
    setErrorMsg(null);
  }

  const isProfileComplete = completionPercentage === 100;

  return (
    <Card
      className={
        isProfileComplete
          ? "border border-slate-200 bg-white hover:border-slate-300 dark:border-[#2E2D2A] dark:bg-[#1C1B19] dark:hover:border-[#3A3834] rounded-xl shadow-xs overflow-hidden transition-colors"
          : "border border-amber-200 bg-amber-50/40 hover:border-amber-300 dark:border-amber-900/50 dark:bg-amber-950/15 dark:hover:border-amber-800/70 rounded-xl shadow-xs overflow-hidden transition-colors"
      }
    >
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={
          isProfileComplete
            ? "w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-[#292826]/50 transition-colors"
            : "w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-amber-50/70 dark:hover:bg-amber-950/30 transition-colors"
        }
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={
              isProfileComplete
                ? "w-9 h-9 rounded-lg bg-slate-100 text-slate-600 dark:bg-[#292826] dark:text-[#A8A29E] flex items-center justify-center shrink-0"
                : "w-9 h-9 rounded-lg bg-amber-100/80 text-[#EA580C] dark:bg-amber-950/60 dark:text-[#D95D39] flex items-center justify-center shrink-0"
            }
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F4F4F0]">
                {t("profile.aiAutoFill.title", "AI Quick Profile Fill")}
              </h2>
              <span
                className={
                  isProfileComplete
                    ? "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-[#292826] dark:text-[#A8A29E] dark:border-[#3A3834]"
                    : "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/70 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50"
                }
              >
                EN / हिन्दी / Hinglish
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#A8A29E] mt-0.5">
              {t(
                "profile.aiAutoFill.subtitle",
                "Describe yourself once in plain words — review extracted fields before updating your form."
              )}
            </p>
          </div>
        </div>

        <span className="text-slate-500 dark:text-[#A8A29E] shrink-0">
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </span>
      </button>

      {/* Expandable Body */}
      {isOpen && (
        <div
          className={
            isProfileComplete
              ? "px-5 pb-5 pt-1 space-y-4 border-t border-slate-200 dark:border-[#2E2D2A]"
              : "px-5 pb-5 pt-1 space-y-4 border-t border-amber-200/70 dark:border-amber-900/40"
          }
        >
          {/* Example Prompt Chips */}
          <div className="pt-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t("profile.aiAutoFill.tryExample", "Try an example:")}
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_KEYS.map((exKey) => {
                const label = t(
                  `profile.aiAutoFill.examples.${exKey}.label`,
                  exKey
                );
                const text = t(
                  `profile.aiAutoFill.examples.${exKey}.text`,
                  ""
                );
                return (
                  <button
                    key={exKey}
                    type="button"
                    disabled={extracting}
                    onClick={() => {
                      setInputText(text);
                      setErrorMsg(null);
                    }}
                    className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:bg-accent hover:border-saffron/50 text-foreground transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single Free-Text Box */}
          <div className="space-y-1.5">
            <label htmlFor="ai-profile-textarea" className="sr-only">
              {t("profile.aiAutoFill.title", "AI Quick Profile Fill")}
            </label>
            <textarea
              id="ai-profile-textarea"
              rows={3}
              maxLength={600}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={t(
                "profile.aiAutoFill.placeholder",
                "e.g. I am a 20 year old B.Tech student from Patna, EBC category, family income 1.8 lakh..."
              )}
              disabled={extracting}
              className="w-full rounded-lg border border-slate-300 dark:border-[#3A3834] bg-white dark:bg-[#141413] px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F4F4F0] placeholder:text-slate-400 dark:placeholder:text-[#A8A29E] outline-none transition-colors focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15 dark:focus:border-[#D95D39] dark:focus:ring-[#D95D39]/20 disabled:opacity-60 resize-y min-h-[84px]"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                {t(
                  "profile.aiAutoFill.privacyNotice",
                  "Please avoid typing Aadhaar, PAN, or bank numbers."
                )}
              </span>
              <span>{inputText.length}/600</span>
            </div>
          </div>

          {/* Extract Action */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {inputText && !extracting && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setInputText("");
                  handleDiscard();
                }}
              >
                {t("profile.aiAutoFill.clearInput", "Clear")}
              </Button>
            )}
            <Button
              type="button"
              onClick={handleExtract}
              disabled={extracting || inputText.trim().length < 3}
              className="bg-[#1E3A8A] hover:bg-[#172554] text-white dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] rounded-lg gap-2 cursor-pointer"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("profile.aiAutoFill.extracting", "Extracting Details...")}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t(
                    "profile.aiAutoFill.extractButton",
                    "Extract Profile Fields"
                  )}
                </>
              )}
            </Button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-300 flex items-start gap-2 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Review & Confirm Preview Card */}
          {result && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-navy dark:text-white">
                    {t(
                      "profile.aiAutoFill.reviewTitle",
                      "Review Extracted Fields"
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "profile.aiAutoFill.reviewSubtitle",
                      "Select the fields you want to apply to your profile form."
                    )}
                  </p>
                </div>
                {result.extraction_source && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {result.extraction_source === "fallback"
                      ? t("profile.aiAutoFill.sourceFallback", "Smart Parser")
                      : t("profile.aiAutoFill.sourceAi", "AI Extracted")}
                  </span>
                )}
              </div>

              {/* Privacy Warning from Backend Redaction */}
              {result.profile.privacy_warning && (
                <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300 flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{result.profile.privacy_warning}</span>
                </div>
              )}

              {/* Non-Bihar Advisory */}
              {nonBiharState && (
                <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300 flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {t(
                      "profile.aiAutoFill.nonBiharNotice",
                      "Detected state '{{state}}'. GovGuide currently supports Bihar residents only, so State was not changed.",
                      { state: nonBiharState }
                    )}
                  </span>
                </div>
              )}

              {/* Candidate Field Diff Rows */}
              {candidateRows.length > 0 ? (
                <div className="divide-y divide-border rounded-md border border-border overflow-hidden">
                  {candidateRows.map((row) => {
                    const isMatches = row.diffKind === "matches";
                    const isChecked = !isMatches && Boolean(selectedKeys[row.key]);
                    const label = t(row.labelKey, row.defaultLabel);

                    return (
                      <label
                        key={row.key}
                        className={`flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors ${
                          isMatches
                            ? "bg-muted/30 text-muted-foreground cursor-default"
                            : "hover:bg-accent/40 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            disabled={isMatches}
                            checked={isMatches ? true : isChecked}
                            onChange={() => handleToggleKey(row.key)}
                            className="mt-0.5 sm:mt-0 h-4 w-4 rounded border-input accent-navy dark:accent-saffron cursor-pointer disabled:opacity-50"
                          />
                          <div className="min-w-0">
                            <div className="text-xs text-muted-foreground">
                              {label}
                            </div>
                            <div className="font-semibold text-navy dark:text-white truncate">
                              {row.displayValue}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {row.diffKind === "new" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900">
                              {t("profile.aiAutoFill.badgeNew", "New")}
                            </span>
                          )}
                          {row.diffKind === "replaces" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900">
                              {t("profile.aiAutoFill.badgeReplaces", "Replaces")}:{" "}
                              {row.currentDisplayValue}
                            </span>
                          )}
                          {row.diffKind === "matches" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                              {t("profile.aiAutoFill.badgeMatches", "Matches")}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground py-2">
                  {t(
                    "profile.aiAutoFill.noFieldsExtracted",
                    "No profile fields could be matched cleanly. Try adding details like age, Bihar district, occupation, category, or annual income."
                  )}
                </p>
              )}

              {/* Notes & Missing Fields */}
              {result.profile.confidence_notes && (
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{result.profile.confidence_notes}</span>
                </p>
              )}

              {missingFieldLabels.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">
                    {t("profile.aiAutoFill.stillMissing", "Not mentioned yet:")}{" "}
                  </span>
                  {missingFieldLabels.join(", ")}
                </p>
              )}

              {/* Preview Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDiscard}
                  className="gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  {t("profile.aiAutoFill.discardButton", "Discard")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplySelected}
                  disabled={selectedApplyCount === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t("profile.aiAutoFill.applyButton", "Apply Selected to Form")} (
                  {selectedApplyCount})
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
