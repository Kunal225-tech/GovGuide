import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  LogIn,
  Loader2,
  Save,
  RotateCcw,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { getProfile, updateProfile, AuthError } from "@/services/profileApi";
import type {
  ProfileFormFields,
  UpdateProfilePayload,
  UserProfile,
} from "@/types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AiProfileAutoFillPanel } from "@/components/profile/AiProfileAutoFillPanel";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/utils";

// ============================================================
// ProfilePage
// Route: /profile
// ============================================================

type FormFields = ProfileFormFields;

type PageState = "loading" | "fetch-error" | "auth-error" | "ready";
type SaveState = "idle" | "saving" | "saved" | "error";

type FormErrors = Partial<Record<keyof FormFields, string>>;

const BIHAR_STATES = ["Bihar"];

const STATE_DISTRICTS: Record<string, string[]> = {
  "Bihar": [
    "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar",
    "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar",
    "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur",
    "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran",
    "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran",
  ],
};

const GENDER_OPTIONS = ["Male", "Female", "Transgender", "Prefer not to say"];
const OCCUPATION_OPTIONS = [
  "Student", "Job Seeker", "Unemployed", "Farmer",
  "Self Employed", "Street Vendor", "Daily Wage Earner", "Driver",
  "Employed (Salaried)", "Homemaker", "Retired", "Other",
];
const EDUCATION_OPTIONS = [
  "No formal education", "Primary (up to Class 5)",
  "10th Pass", "12th Pass", "ITI", "Polytechnic",
  "Undergraduate", "Graduate", "Post Graduate",
  "Doctorate (PhD)", "Other",
];
const CATEGORY_OPTIONS = [
  "General", "OBC", "BC", "EBC", "SC", "ST", "EWS", "Minority", "Other",
];

function formatIndianCurrency(amountStr: string): string | null {
  if (!amountStr || amountStr.trim() === "") return null;
  const num = Number(amountStr);
  if (isNaN(num) || num < 0) return null;
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
  return `${formatted} / year`;
}

function profileToForm(p: UserProfile): FormFields {
  const isBihar = (p.state || "").trim().toLowerCase() === "bihar";
  const biharDistricts = STATE_DISTRICTS["Bihar"] || [];
  const validDistrict =
    p.district && (isBihar || biharDistricts.includes(p.district)) ? p.district : "";
  return {
    age: p.age !== undefined && p.age !== null ? String(p.age) : "",
    gender: p.gender ?? "",
    state: "Bihar",
    district: validDistrict,
    annualIncome: p.annualIncome !== undefined && p.annualIncome !== null ? String(p.annualIncome) : "",
    occupation: p.occupation ?? "",
    education: p.education ?? "",
    category: p.category ?? "",
  };
}

const EMPTY_FORM: FormFields = {
  age: "", gender: "", state: "Bihar", district: "",
  annualIncome: "", occupation: "", education: "", category: "",
};

export function ProfilePage() {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [fetchErrorMsg, setFetchErrorMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<FormFields>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [aiHighlightedFields, setAiHighlightedFields] = useState<
    Partial<Record<keyof FormFields, boolean>>
  >({});
  const [aiAppliedCount, setAiAppliedCount] = useState<number | null>(null);

  const loadProfile = useCallback(async () => {
    setPageState("loading");
    setFetchErrorMsg("");
    try {
      const user = await getProfile();
      updateUser(user);
      setUserName(user.name || "");
      setUserEmail(user.email || "");
      const formValues = profileToForm(user.profile ?? {});
      setForm(formValues);
      setInitialForm(formValues);
      setPageState("ready");
    } catch (err) {
      if (err instanceof AuthError) {
        setPageState("auth-error");
      } else {
        setFetchErrorMsg(err instanceof Error ? err.message : "Failed to load profile.");
        setPageState("fetch-error");
      }
    }
  }, [updateUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function clearFieldHighlight(field: keyof FormFields) {
    setAiHighlightedFields((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    const fieldKey = name as keyof FormFields;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearFieldHighlight(fieldKey);
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (saveState === "saved") setSaveState("idle");
  }

  function handleStateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextState = e.target.value;
    setForm((prev) => {
      // If switching state, check if current district belongs to the new state
      const nextDistricts = nextState ? STATE_DISTRICTS[nextState] || [] : [];
      const districtStillValid = nextDistricts.includes(prev.district);
      return {
        ...prev,
        state: nextState,
        district: districtStillValid ? prev.district : "",
      };
    });
    clearFieldHighlight("state");
    if (errors.state) {
      setErrors((prev) => ({ ...prev, state: undefined }));
    }
    if (saveState === "saved") setSaveState("idle");
  }

  function handleAiApply(fields: Partial<FormFields>) {
    const appliedKeys = Object.keys(fields) as Array<keyof FormFields>;
    if (appliedKeys.length === 0) return;

    const mergedFields: Partial<FormFields> = { ...fields };
    if (mergedFields.district && !form.state && !mergedFields.state) {
      mergedFields.state = "Bihar";
    }

    setForm((prev) => ({ ...prev, ...mergedFields }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(mergedFields) as Array<keyof FormErrors>) {
        delete next[key];
      }
      return next;
    });
    setAiHighlightedFields((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(mergedFields) as Array<keyof FormFields>) {
        next[key] = true;
      }
      return next;
    });
    setAiAppliedCount(Object.keys(mergedFields).length);
    if (saveState === "saved") setSaveState("idle");
  }

  function handleReset() {
    setForm(initialForm);
    setErrors({});
    setAiHighlightedFields({});
    setAiAppliedCount(null);
    if (saveState === "saved") setSaveState("idle");
  }

  const isDirty = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  // Profile completion calculation across all 8 editable fields
  const completionPercentage = useMemo(() => {
    const fields: (keyof FormFields)[] = [
      "age", "gender", "category",
      "state", "district",
      "education", "occupation", "annualIncome",
    ];
    const completedCount = fields.filter((f) => Boolean(form[f]?.trim())).length;
    return Math.round((completedCount / fields.length) * 100);
  }, [form]);

  // Retain existing custom or legacy select values if already saved in user profile
  const districtOptions = useMemo(() => {
    const list = [...(STATE_DISTRICTS["Bihar"] || [])];
    if (form.district && !list.includes(form.district)) {
      list.unshift(form.district);
    }
    return list;
  }, [form.district]);

  const categoryOptions = useMemo(() => {
    const list = [...CATEGORY_OPTIONS];
    if (form.category && !list.includes(form.category)) {
      list.unshift(form.category);
    }
    return list;
  }, [form.category]);

  const educationOptions = useMemo(() => {
    const list = [...EDUCATION_OPTIONS];
    if (form.education && !list.includes(form.education)) {
      list.unshift(form.education);
    }
    return list;
  }, [form.education]);

  const occupationOptions = useMemo(() => {
    const list = [...OCCUPATION_OPTIONS];
    if (form.occupation && !list.includes(form.occupation)) {
      list.unshift(form.occupation);
    }
    return list;
  }, [form.occupation]);

  const formattedIncomeText = useMemo(() => {
    return formatIndianCurrency(form.annualIncome);
  }, [form.annualIncome]);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (form.age) {
      const ageNum = Number(form.age);
      if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
        newErrors.age = "Age must be a whole number between 1 and 120.";
      }
    }

    if (form.annualIncome) {
      const inc = Number(form.annualIncome);
      if (isNaN(inc) || inc < 0) {
        newErrors.annualIncome = "Annual income cannot be negative.";
      }
      if (inc > 100_000_000) {
        newErrors.annualIncome = "Please enter a realistic income value.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (saveState === "saving") return;

    setSaveState("saving");
    setSaveErrorMsg("");

    const payload: UpdateProfilePayload = {};
    if (form.age)          payload.age = Number(form.age);
    if (form.gender)       payload.gender = form.gender;
    if (form.state)        payload.state = form.state;
    if (form.district)     payload.district = form.district;
    if (form.annualIncome) payload.annualIncome = Number(form.annualIncome);
    if (form.occupation)   payload.occupation = form.occupation;
    if (form.education)    payload.education = form.education;
    if (form.category)     payload.category = form.category;

    try {
      const updated = await updateProfile(payload);
      updateUser(updated);
      const updatedForm = profileToForm(updated.profile ?? {});
      setForm(updatedForm);
      setInitialForm(updatedForm);
      setAiHighlightedFields({});
      setAiAppliedCount(null);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 4000);
    } catch (err) {
      setSaveErrorMsg(err instanceof Error ? err.message : "Failed to save profile.");
      setSaveState("error");
    }
  }

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#111110]">
        <ProfileHeader loading />
        <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-8 pb-16">
          <div className="space-y-5 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] p-6 space-y-4 shadow-xs"
              >
                <div className="h-4 w-32 bg-slate-200 dark:bg-[#292826] rounded" />
                <div className="h-11 w-full bg-slate-100 dark:bg-[#292826] rounded-lg" />
                <div className="h-11 w-full bg-slate-100 dark:bg-[#292826] rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "auth-error") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#111110] flex flex-col">
        <ProfileHeader />
        <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-16 flex-1 flex flex-col items-center justify-center text-center gap-5">
          <div className="p-5 rounded-xl bg-blue-50 text-[#1E3A8A] border border-blue-200 dark:bg-[#D95D39]/15 dark:text-[#D95D39] dark:border-[#D95D39]/30">
            <LogIn className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F4F4F0] mb-2">
              {t('auth.login.title')}
            </h2>
            <p className="text-slate-600 dark:text-[#A8A29E] text-sm max-w-sm mx-auto">
              {t('eligible.guestNoticeDesc')}
            </p>
          </div>
          <Button
            asChild
            className="rounded-lg px-8 font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] shadow-none"
          >
            <Link to="/login">{t('auth.login.signIn')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (pageState === "fetch-error") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#111110] flex flex-col">
        <ProfileHeader />
        <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-16 flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-[#F4F4F0]">{t('common.error')}</h2>
          <p className="text-slate-600 dark:text-[#A8A29E] text-sm max-w-sm">{fetchErrorMsg}</p>
          <Button
            onClick={loadProfile}
            variant="outline"
            className="mt-2 flex items-center gap-2 rounded-lg font-semibold text-slate-700 dark:text-[#F4F4F0] border-slate-300 dark:border-[#2E2D2A] hover:bg-slate-50 dark:hover:bg-[#292826]"
          >
            <RefreshCcw className="w-4 h-4" />
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const userInitials = getInitials(userName);
  const isComplete = completionPercentage === 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#111110]">
      <ProfileHeader />

      <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-8 pb-16 space-y-6">

        {/* ---- User Identity Card ---- */}
        <Card className="p-5 sm:p-6 border border-slate-200 dark:border-[#2E2D2A] bg-white dark:bg-[#1C1B19] rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 dark:bg-[#292826] dark:text-[#F4F4F0] flex items-center justify-center font-semibold text-base shrink-0 border border-slate-200 dark:border-[#3A3834]">
              {userInitials || <User className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-[#F4F4F0] truncate text-base leading-snug">
                {userName || "Citizen"}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A8A29E] truncate">
                {userEmail}
              </p>
            </div>
          </div>

          {/* Profile Completion Indicator */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div
              className={`inline-flex items-center gap-1.5 font-semibold text-xs px-2.5 py-1 rounded-full border ${
                isComplete
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900"
                  : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isComplete ? "bg-emerald-600 dark:bg-emerald-400" : "bg-[#EA580C] dark:bg-[#D95D39]"
                }`}
              />
              <span>
                {completionPercentage}% {t('profile.complete', 'Complete')}
              </span>
            </div>
            <div
              className="w-28 sm:w-32 h-1.5 bg-slate-200 dark:bg-[#292826] rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={completionPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={
                  isComplete
                    ? "bg-emerald-500 h-1.5 rounded-full w-full transition-all duration-300"
                    : "bg-[#EA580C] dark:bg-[#D95D39] h-1.5 rounded-full transition-all duration-300"
                }
                style={isComplete ? undefined : { width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Save feedback banners */}
        {saveState === "saved" && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300 flex items-center gap-2 text-sm font-medium shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {t('profile.savedSuccess')}
          </div>
        )}
        {saveState === "error" && saveErrorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-400 flex items-center gap-2 text-sm font-medium shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {saveErrorMsg}
          </div>
        )}

        {/* AI Profile Auto-Fill */}
        <AiProfileAutoFillPanel
          currentForm={form}
          completionPercentage={completionPercentage}
          onApplyFields={handleAiApply}
        />

        {aiAppliedCount !== null && aiAppliedCount > 0 && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300 flex items-center gap-2 text-sm font-medium shadow-xs">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              {t(
                'profile.aiAutoFill.appliedReminder',
                'Applied {{count}} AI-extracted field(s) to the form. Review the highlighted fields below and click Save Profile Changes to confirm.',
                { count: aiAppliedCount }
              )}
            </span>
          </div>
        )}

        {/* The form */}
        <Card className="bg-white dark:bg-[#1C1B19] border border-slate-200 dark:border-[#2E2D2A] rounded-xl p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-8">
              {/* ---- Section 1: Personal Information ---- */}
              <FormSection title={t('profile.personalInfo', 'Personal Information')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldGroup
                    id="profile-age"
                    label={t('profile.age', 'Age (years)')}
                    error={errors.age}
                    aiHighlighted={aiHighlightedFields.age}
                  >
                    <Input
                      id="profile-age"
                      name="age"
                      type="number"
                      placeholder="e.g. 28"
                      min={1}
                      max={120}
                      value={form.age}
                      onChange={handleChange}
                      aria-invalid={!!errors.age}
                      className={`${INPUT_BASE_CLASSES} px-3.5 ${getFieldBorderClass(
                        Boolean(errors.age),
                        aiHighlightedFields.age,
                        "border-slate-300 dark:border-[#2E2D2A]"
                      )}`}
                    />
                  </FieldGroup>

              <FieldGroup
                id="profile-gender"
                label={t('profile.gender', 'Gender')}
                error={errors.gender}
                aiHighlighted={aiHighlightedFields.gender}
              >
                <SelectInput
                  id="profile-gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  options={GENDER_OPTIONS}
                  placeholder={t('profile.selectGender', 'Select gender')}
                  error={errors.gender}
                  aiHighlighted={aiHighlightedFields.gender}
                />
              </FieldGroup>
            </div>

            <FieldGroup
              id="profile-category"
              label={t('profile.casteCategory', 'Social Category')}
              error={errors.category}
              aiHighlighted={aiHighlightedFields.category}
            >
              <SelectInput
                id="profile-category"
                name="category"
                value={form.category}
                onChange={handleChange}
                options={categoryOptions}
                placeholder={t('profile.selectCategory', 'Select social category')}
                error={errors.category}
                aiHighlighted={aiHighlightedFields.category}
              />
            </FieldGroup>
          </FormSection>

          {/* ---- Card 2: Location & Residence ---- */}
          <FormSection title={t('profile.locationResidence', 'Location & Residence')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup
                id="profile-state"
                label={t('profile.state', 'State')}
                hint={t('profile.biharOnlyHint', 'Dedicated portal for Bihar residents & Bihar-applicable Central schemes.')}
                error={errors.state}
                aiHighlighted={aiHighlightedFields.state}
              >
                <SelectInput
                  id="profile-state"
                  name="state"
                  value={form.state || "Bihar"}
                  onChange={handleStateChange}
                  options={BIHAR_STATES}
                  placeholder={t('profile.selectState', 'Select state')}
                  error={errors.state}
                  aiHighlighted={aiHighlightedFields.state}
                />
              </FieldGroup>

              <FieldGroup
                id="profile-district"
                label={t('profile.district', 'District')}
                error={errors.district}
                aiHighlighted={aiHighlightedFields.district}
              >
                <SelectInput
                  id="profile-district"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  options={districtOptions}
                  placeholder={t('profile.selectDistrict', 'Select district')}
                  error={errors.district}
                  aiHighlighted={aiHighlightedFields.district}
                />
              </FieldGroup>
            </div>
          </FormSection>

          {/* ---- Card 3: Education & Employment ---- */}
          <FormSection title={t('profile.educationEmployment', 'Education & Employment')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup
                id="profile-education"
                label={t('profile.highestEducation', 'Highest Education')}
                error={errors.education}
                aiHighlighted={aiHighlightedFields.education}
              >
                <SelectInput
                  id="profile-education"
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  options={educationOptions}
                  placeholder={t('profile.selectEducation', 'Select education level')}
                  error={errors.education}
                  aiHighlighted={aiHighlightedFields.education}
                />
              </FieldGroup>

              <FieldGroup
                id="profile-occupation"
                label={t('profile.employmentStatus', 'Employment Status')}
                error={errors.occupation}
                aiHighlighted={aiHighlightedFields.occupation}
              >
                <SelectInput
                  id="profile-occupation"
                  name="occupation"
                  value={form.occupation}
                  onChange={handleChange}
                  options={occupationOptions}
                  placeholder={t('profile.selectEmployment', 'Select employment status')}
                  error={errors.occupation}
                  aiHighlighted={aiHighlightedFields.occupation}
                />
              </FieldGroup>
            </div>
          </FormSection>

          {/* ---- Card 4: Financial Details ---- */}
          <FormSection title={t('profile.financialDetails', 'Financial Details')}>
            <FieldGroup
              id="profile-income"
              label={t('profile.annualIncome', 'Annual Household Income (₹)')}
              hint={t('profile.incomeHint', 'Your total household income per year in Indian Rupees.')}
              error={errors.annualIncome}
              aiHighlighted={aiHighlightedFields.annualIncome}
            >
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 dark:text-[#A8A29E] font-semibold text-sm">
                    ₹
                  </div>
                  <Input
                    id="profile-income"
                    name="annualIncome"
                    type="number"
                    placeholder="e.g. 250000"
                    min={0}
                    value={form.annualIncome}
                    onChange={handleChange}
                    aria-invalid={!!errors.annualIncome}
                    className={`${INPUT_BASE_CLASSES} pl-8 pr-3.5 ${getFieldBorderClass(
                      Boolean(errors.annualIncome),
                      aiHighlightedFields.annualIncome,
                      "border-slate-300 dark:border-[#2E2D2A]"
                    )}`}
                  />
                </div>
                {formattedIncomeText && (
                  <p className="text-xs text-slate-700 dark:text-stone-300 font-medium flex items-center gap-1 mt-1.5">
                    <span className="text-slate-500 dark:text-[#A8A29E]">
                      {t('profile.incomeFormatted', 'Formatted:')}
                    </span>
                    <span className="font-semibold">{formattedIncomeText}</span>
                  </p>
                )}
              </FieldGroup>
            </FormSection>
            </div>

            {/* ---- Action Button Bar ---- */}
            <div className="border-t border-slate-200 dark:border-[#2E2D2A] pt-5 mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={!isDirty || saveState === "saving"}
                className="w-full sm:w-auto h-10 px-5 rounded-lg font-medium border-slate-300 dark:border-[#2E2D2A] text-slate-700 dark:text-[#F4F4F0] hover:bg-slate-50 dark:hover:bg-[#292826] transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                {t('profile.reset', 'Reset')}
              </Button>

              <Button
                type="submit"
                disabled={saveState === "saving"}
                className="w-full sm:w-auto h-10 px-6 bg-[#1E3A8A] hover:bg-[#172554] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] text-white font-semibold rounded-lg shadow-none flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saveState === "saving" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.loading', 'Saving...')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('profile.saveProfile', 'Save Profile Changes')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

const INPUT_BASE_CLASSES =
  "h-11 rounded-lg bg-white dark:bg-[#111110] text-sm text-slate-900 dark:text-[#F4F4F0] shadow-none focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15 focus-visible:outline-none focus-visible:border-blue-700 focus-visible:ring-2 focus-visible:ring-blue-700/15 dark:focus:border-[#D95D39] dark:focus:ring-[#D95D39]/20 dark:focus-visible:border-[#D95D39] dark:focus-visible:ring-[#D95D39]/20";

function ProfileHeader({ loading = false }: { loading?: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-[#1C1B19] border-b border-slate-200 dark:border-[#2E2D2A] py-8">
      <div className="max-w-[840px] mx-auto px-4 sm:px-6">
        <div className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-[#292826] dark:text-[#F4F4F0] text-xs font-bold tracking-widest uppercase border border-slate-200 dark:border-[#3A3834] mb-3">
          {loading ? (
            <span className="h-3 w-16 bg-slate-200 dark:bg-[#292826] rounded animate-pulse inline-block" />
          ) : (
            t('nav.myProfile', 'My Profile')
          )}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-[#F4F4F0] mb-2 tracking-tight">
          {loading ? (
            <span className="h-8 w-48 bg-slate-200 dark:bg-[#292826] rounded animate-pulse inline-block" />
          ) : (
            t('profile.title', 'Citizen Profile')
          )}
        </h1>
        <p className="text-slate-600 dark:text-[#A8A29E] text-sm sm:text-base max-w-2xl leading-relaxed">
          {loading ? (
            <span className="h-4 w-72 bg-slate-200 dark:bg-[#292826] rounded animate-pulse inline-block" />
          ) : (
            t(
              'profile.subtitle',
              'Update your details to accurately check your eligibility for government schemes and benefits.'
            )
          )}
        </p>
      </div>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-bold text-slate-800 dark:text-[#F4F4F0] uppercase tracking-wider border-b border-slate-200/80 dark:border-[#2E2D2A] pb-2.5">
        {title}
      </h2>
      {children}
    </section>
  );
}

function getFieldBorderClass(
  hasError: boolean,
  aiHighlighted?: boolean,
  defaultBorderClass = ""
): string {
  if (hasError) return "border-red-500 dark:border-red-500";
  if (aiHighlighted) {
    return "border-emerald-500 ring-1 ring-emerald-500/25 dark:border-emerald-500/80";
  }
  return defaultBorderClass;
}

function FieldGroup({
  id,
  label,
  hint,
  error,
  aiHighlighted = false,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  aiHighlighted?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-800 dark:text-[#F4F4F0]">
          {label}
        </label>
        {aiHighlighted && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900">
            <Sparkles className="w-3 h-3" />
            {t("profile.aiAutoFill.fieldBadge", "AI Filled")}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500 dark:text-[#A8A29E]">{hint}</p>}
      {children}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function SelectInput({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error,
  aiHighlighted = false,
}: {
  id: string;
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  error?: string;
  aiHighlighted?: boolean;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={!!error}
        className={`appearance-none flex w-full border pl-3.5 pr-10 transition-[border-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-[#1C1B19] ${INPUT_BASE_CLASSES} ${getFieldBorderClass(
          Boolean(error),
          aiHighlighted,
          "border-slate-300 dark:border-[#2E2D2A]"
        )}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-[#A8A29E]"
        aria-hidden="true"
      />
    </div>
  );
}
