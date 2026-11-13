import type { Scheme } from "@/types/scheme";

export interface BenefitStat {
  label: string;
  value: string;
}

export interface QuickOverviewRow {
  labelKey: string;
  defaultLabel: string;
  value: string;
}

export interface SchemeHighlights {
  benefitStats: BenefitStat[];
  quickOverview: QuickOverviewRow[];
}

interface StatPreset {
  match: (nameLower: string, benefitsText: string) => boolean;
  stats: (nameLower: string, benefitsText: string) => BenefitStat[];
}

const STAT_PRESETS: StatPreset[] = [
  {
    match: (name) => name.includes("udyami"),
    stats: (name, text) => {
      const isZeroInterest = text.includes("0%") && !name.includes("yuva");
      const interestRate = isZeroInterest ? "0%" : text.includes("1%") ? "1%" : "0%";
      return [
        { label: "MAX ASSISTANCE", value: "₹10 Lakh" },
        { label: "DIRECT GRANT", value: "50% (Up to ₹5L)" },
        { label: "LOAN INTEREST", value: `${interestRate} (84 Installments)` },
      ];
    },
  },
  {
    match: (name) => name.includes("student credit card"),
    stats: () => [
      { label: "MAX LOAN", value: "₹4 Lakh" },
      { label: "INTEREST RATE", value: "1% (Girls) / 4%" },
      { label: "MORATORIUM", value: "Course + 1 Yr" },
    ],
  },
  {
    match: (name) => name.includes("balak / balika protsahan"),
    stats: () => [
      { label: "1ST DIVISION", value: "₹10,000" },
      { label: "2ND DIV (SC/ST)", value: "₹8,000" },
      { label: "DISBURSAL", value: "100% DBT" },
    ],
  },
  {
    match: (name) => name.includes("kanya utthan") && name.includes("graduation"),
    stats: () => [
      { label: "DIRECT GRANT", value: "₹50,000" },
      { label: "DISBURSAL", value: "100% DBT" },
      { label: "STREAMS", value: "All Degrees" },
    ],
  },
  {
    match: (name) => name.includes("kanya utthan") && name.includes("12th"),
    stats: () => [
      { label: "DIRECT GRANT", value: "₹25,000" },
      { label: "DISBURSAL", value: "100% DBT" },
      { label: "COVERAGE", value: "All Divisions" },
    ],
  },
  {
    match: (name) => name.includes("swayam sahayata bhatta"),
    stats: () => [
      { label: "MONTHLY SUPPORT", value: "₹1,000 / mo" },
      { label: "DURATION", value: "Up to 24 Months" },
      { label: "TRAINING", value: "Free KYP Included" },
    ],
  },
  {
    match: (name) => name.includes("kushal yuva"),
    stats: () => [
      { label: "TRAINING HOURS", value: "240 Hours" },
      { label: "CURRICULUM", value: "IT & Soft Skills" },
      { label: "SECURITY DEPOSIT", value: "₹1,000 Refundable" },
    ],
  },
  {
    match: (name) => name.includes("bpsc civil seva"),
    stats: () => [
      { label: "DIRECT GRANT", value: "₹50,000" },
      { label: "STAGE", value: "Prelims Qualified" },
      { label: "REPAYMENT", value: "Non-Repayable" },
    ],
  },
  {
    match: (name) => name.includes("upsc civil seva"),
    stats: () => [
      { label: "DIRECT GRANT", value: "₹1,00,000" },
      { label: "STAGE", value: "Prelims Qualified" },
      { label: "DISBURSAL", value: "100% DBT" },
    ],
  },
  {
    match: (name) => name.includes("post-matric scholarship"),
    stats: () => [
      { label: "COURSE FEES", value: "100% Reimbursed" },
      { label: "ALLOWANCE", value: "Monthly DBT" },
      { label: "INCOME LIMIT", value: "Up to ₹3 Lakh" },
    ],
  },
  {
    match: (name) => name.includes("cycle yojana"),
    stats: () => [
      { label: "DIRECT GRANT", value: "₹3,000" },
      { label: "DISBURSAL", value: "100% DBT" },
      { label: "TARGET CLASS", value: "Class 9" },
    ],
  },
  {
    match: (name) => name.includes("vridhajan pension"),
    stats: () => [
      { label: "AGE 60–79 YRS", value: "₹400 / month" },
      { label: "AGE 80+ YRS", value: "₹500 / month" },
      { label: "INCOME CEILING", value: "None (Universal)" },
    ],
  },
  {
    match: (name) => name.includes("laxmi bai"),
    stats: () => [
      { label: "MONTHLY PENSION", value: "₹400 / month" },
      { label: "COVERAGE", value: "Lifelong" },
      { label: "DISBURSAL", value: "DBT (SSPMIS)" },
    ],
  },
  {
    match: (name) => name.includes("divyangjan pension"),
    stats: () => [
      { label: "MONTHLY PENSION", value: "₹400 / month" },
      { label: "ASSISTIVE AIDS", value: "Free (ALIMCO)" },
      { label: "MIN DISABILITY", value: "40% Certified" },
    ],
  },
  {
    match: (name) => name.includes("kanya vivah"),
    stats: () => [
      { label: "DIRECT GRANT", value: "₹5,000" },
      { label: "DISBURSAL", value: "One-Time DBT" },
      { label: "INCOME LIMIT", value: "Up to ₹60,000" },
    ],
  },
  {
    match: (name) => name.includes("krishi input anudan"),
    stats: () => [
      { label: "UN-IRRIGATED", value: "₹8,500 / ha" },
      { label: "IRRIGATED", value: "₹17,000 / ha" },
      { label: "ORCHARDS / CANE", value: "₹22,500 / ha" },
    ],
  },
  {
    match: (name) => name.includes("diesel anudan"),
    stats: () => [
      { label: "FUEL SUBSIDY", value: "₹75 / litre" },
      { label: "PER IRRIGATION", value: "₹750 / acre" },
      { label: "MAX COVERAGE", value: "Up to 8 Acres" },
    ],
  },
  {
    match: (name) => name.includes("krishi yantrikikaran"),
    stats: () => [
      { label: "GENERAL FARMERS", value: "40% – 50%" },
      { label: "SC / ST / EBC", value: "75% – 80%" },
      { label: "MACHINES", value: "90+ Covered" },
    ],
  },
  {
    match: (name) => name.includes("bal hriday"),
    stats: () => [
      { label: "SURGERY COST", value: "100% Free" },
      { label: "TRAVEL & STAY", value: "Free (Patient + 2)" },
      { label: "AGE GROUP", value: "0 – 18 Years" },
    ],
  },
  {
    match: (name) => name.includes("chikitsa sahayata"),
    stats: () => [
      { label: "TRANSPLANTS", value: "Up to ₹5 Lakh" },
      { label: "CANCER / HEART", value: "₹1L – ₹2.5L" },
      { label: "PAYMENT MODE", value: "Direct to Hospital" },
    ],
  },
  {
    match: (name) => name.includes("pravasi mazdoor"),
    stats: () => [
      { label: "DEATH RELIEF", value: "₹1,00,000" },
      { label: "FULL DISABILITY", value: "₹75,000" },
      { label: "PARTIAL", value: "₹37,500" },
    ],
  },
  {
    match: (name) => name.includes("jeevika"),
    stats: () => [
      { label: "SHG CIF FUND", value: "Up to ₹1.5 Lakh" },
      { label: "BANK CREDIT", value: "₹2L – ₹5L" },
      { label: "REVOLVING FUND", value: "₹15,000 / SHG" },
    ],
  },
  {
    match: (name) => name.includes("gram parivahan"),
    stats: () => [
      { label: "VEHICLE SUBSIDY", value: "50% (Up to ₹1L)" },
      { label: "VEHICLES", value: "4–10 Seater / E-Rick" },
      { label: "COVERAGE", value: "Rural Panchayats" },
    ],
  },
  {
    match: (name) => name.includes("pm kisan"),
    stats: () => [
      { label: "ANNUAL SUPPORT", value: "₹6,000 / year" },
      { label: "INSTALLMENTS", value: "₹2,000 × 3" },
      { label: "DISBURSAL", value: "100% DBT" },
    ],
  },
  {
    match: (name) => name.includes("awas yojana"),
    stats: () => [
      { label: "HOUSING GRANT", value: "₹1,20,000" },
      { label: "TOILET GRANT", value: "+₹12,000 (SBM-G)" },
      { label: "MGNREGA WAGES", value: "90–95 Days" },
    ],
  },
  {
    match: (name) => name.includes("ayushman bharat"),
    stats: () => [
      { label: "ANNUAL COVER", value: "₹5 Lakh / family" },
      { label: "PROCEDURES", value: "1,949 Covered" },
      { label: "CLAIM TYPE", value: "100% Cashless" },
    ],
  },
  {
    match: (name) => name.includes("mudra"),
    stats: () => [
      { label: "SHISHU", value: "Up to ₹50,000" },
      { label: "KISHORE", value: "Up to ₹5 Lakh" },
      { label: "TARUN", value: "Up to ₹10L (₹20L+)" },
    ],
  },
  {
    match: (name) => name.includes("sukanya samriddhi"),
    stats: () => [
      { label: "INTEREST RATE", value: "8.2% p.a." },
      { label: "MIN DEPOSIT", value: "₹250 / year" },
      { label: "TAX BENEFIT", value: "EEE (Sec 80C)" },
    ],
  },
  {
    match: (name) => name.includes("svanidhi"),
    stats: () => [
      { label: "LOAN TRANCHES", value: "₹10K → ₹20K → ₹50K" },
      { label: "INTEREST SUBSIDY", value: "7% Quarterly" },
      { label: "CASHBACK", value: "Up to ₹1,200 / yr" },
    ],
  },
];

function extractGenericBenefitStats(benefits: string[]): BenefitStat[] {
  const fullText = benefits.join(" ");
  const stats: BenefitStat[] = [];

  const amountMatch = fullText.match(/(?:Rs\.?|₹)\s*([\d,]+(?:\.\d+)?(?:\s*(?:Lakh|Lakhs|Crore))?)/i);
  if (amountMatch) {
    stats.push({ label: "FINANCIAL BENEFIT", value: `₹${amountMatch[1].trim()}` });
  }

  const pctMatch = fullText.match(/(\d+(?:\.\d+)?%)/);
  if (pctMatch) {
    stats.push({ label: "SUBSIDY / RATE", value: pctMatch[1] });
  }

  if (/\bDBT\b|Direct Benefit Transfer/i.test(fullText)) {
    stats.push({ label: "DISBURSAL", value: "Direct DBT" });
  } else if (/monthly|per month/i.test(fullText)) {
    stats.push({ label: "FREQUENCY", value: "Monthly" });
  } else if (/free|100% free/i.test(fullText)) {
    stats.push({ label: "COST", value: "Zero Fee / Free" });
  }

  return stats.length >= 2 ? stats.slice(0, 3) : [];
}

export function formatDepartment(source?: string): string {
  if (!source) return "Government Department";
  return source
    .replace(/,\s*Government of Bihar/i, ", Bihar")
    .replace(/,\s*Government of India/i, ", GoI")
    .replace(/\bDepartments\b/gi, "Depts")
    .replace(/\bDepartment\b/gi, "Dept")
    .replace(/\bDevelopment\b/gi, "Dev")
    .replace(/\s+and\s+/gi, " & ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractTargetCategory(scheme: Scheme): string {
  const combined = `${scheme.name} ${scheme.eligibility.join(" ")}`;

  if (/Scheduled Caste.*Scheduled Tribe.*Extremely Backward.*(?:Women|female)|SC,\s*ST,\s*EBC,\s*or\s*(?:Women|female)/i.test(combined)) {
    return "SC / ST / EBC / Women";
  }
  if (/SC,\s*ST,\s*BC[^-].*EBC/i.test(combined)) {
    return "SC / ST / BC / EBC";
  }
  if (/SC,\s*ST,\s*(?:or\s*)?EBC/i.test(combined)) {
    return "SC / ST / EBC";
  }
  if (/EBC\s*\/\s*BC-?1|Extremely Backward Class/i.test(combined)) {
    return "EBC / BC-1";
  }
  if (/Scheduled Caste\s*\(SC\)\s*or\s*Scheduled Tribe\s*\(ST\)/i.test(combined)) {
    return "SC / ST";
  }
  if (/General\s+or\s+Backward\s+Class\s*\(BC-?2\)/i.test(combined)) {
    return "General / BC-2 (Male)";
  }
  if (/Widowed woman/i.test(combined)) return "Widowed Women";
  if (/Rural women/i.test(combined)) return "Rural Women";
  if (/Girl child/i.test(combined)) return "Girl Child";
  if (/Unmarried female/i.test(combined)) return "Unmarried Girls (12th)";
  if (/Bride must be/i.test(combined)) return "Eligible Brides";
  if (/Woman resident|Female resident/i.test(combined)) return "Women (All Categories)";
  if (/certified disability/i.test(combined)) return "Persons with Disabilities";
  if (/Age 60 years or above/i.test(combined)) return "Senior Citizens (60+)";
  if (/Street vendor/i.test(combined)) return "Street Vendors";
  if (/migrant wage labourer/i.test(combined)) return "Migrant Workers";
  if (/landholding farmer|Resident farmer|Farmer resident/i.test(combined)) return "Farmers";
  if (/unemployed/i.test(combined)) return "Unemployed Youth";
  if (/student|Class 9|10th|12th/i.test(combined)) return "Students";

  return "All Eligible Citizens";
}

function extractAgeLimit(scheme: Scheme): string | null {
  const text = scheme.eligibility.join(" ");

  const rangeMatch = text.match(
    /age(?:d)?\s+(?:between\s+)?(\d{1,2})\s+(?:and|to|-|–)\s+(\d{1,2})\s+years/i
  );
  if (rangeMatch) {
    return `${rangeMatch[1]} – ${rangeMatch[2]} Years`;
  }

  const aboveMatch = text.match(/age\s+(\d{1,2})\s+years\s+or\s+above/i);
  if (aboveMatch) {
    return `${aboveMatch[1]}+ Years`;
  }

  const maxMatch = text.match(/age\s+not\s+exceeding\s+(\d{1,2})\s+years/i);
  if (maxMatch) {
    return `Up to ${maxMatch[1]} Years`;
  }

  const underMatch = text.match(/before\s+the\s+girl\s+reaches\s+(\d{1,2})\s+years/i);
  if (underMatch) {
    return `Under ${underMatch[1]} Years`;
  }

  if (/any\s+age/i.test(text)) {
    return "All Ages";
  }

  return null;
}

function extractExtraOverviewRow(scheme: Scheme): QuickOverviewRow {
  const benefitsText = scheme.benefits.join(" ");
  const eligibilityText = scheme.eligibility.join(" ");

  const stipendMatch = benefitsText.match(
    /training\s+stipend\s+of\s+(?:Rs\.?|₹)\s*([\d,]+)/i
  );
  if (stipendMatch) {
    return {
      labelKey: "schemeDetails.trainingStipend",
      defaultLabel: "Training Stipend",
      value: `₹${stipendMatch[1]}`,
    };
  }

  const incomeMatch = eligibilityText.match(
    /(?:annual\s+income\s+(?:not\s+exceeding|below|must\s+not\s+exceed)|income\s+below)\s+(?:Rs\.?|₹)\s*([\d,]+(?:\.\d+)?(?:\s*(?:Lakh|Lakhs))?)/i
  );
  if (incomeMatch) {
    return {
      labelKey: "schemeDetails.incomeLimit",
      defaultLabel: "Max Annual Income",
      value: `Up to ₹${incomeMatch[1]}`,
    };
  }

  if (/10\+2\s*\/\s*Intermediate/i.test(eligibilityText)) {
    return {
      labelKey: "schemeDetails.minEducation",
      defaultLabel: "Min. Education",
      value: /ITI/i.test(eligibilityText) ? "10+2 / ITI / Diploma" : "10+2 / Intermediate",
    };
  }

  if (/graduation|degree course/i.test(eligibilityText)) {
    return {
      labelKey: "schemeDetails.minEducation",
      defaultLabel: "Min. Education",
      value: "Graduate",
    };
  }

  if (/10th\s*\(Matric/i.test(eligibilityText)) {
    return {
      labelKey: "schemeDetails.minEducation",
      defaultLabel: "Min. Education",
      value: "10th Pass",
    };
  }

  return {
    labelKey: "schemeDetails.jurisdiction",
    defaultLabel: "Jurisdiction",
    value:
      scheme.level === "central"
        ? "Central (Bihar)"
        : `${scheme.state ?? "Bihar"} State`,
  };
}

export function extractSchemeHighlights(scheme: Scheme): SchemeHighlights {
  const nameLower = scheme.name.toLowerCase();
  const benefitsText = scheme.benefits.join(" ");

  const preset = STAT_PRESETS.find((p) => p.match(nameLower, benefitsText));
  const benefitStats = preset
    ? preset.stats(nameLower, benefitsText)
    : extractGenericBenefitStats(scheme.benefits);

  const quickOverview: QuickOverviewRow[] = [
    {
      labelKey: "schemeDetails.department",
      defaultLabel: "Department",
      value: formatDepartment(scheme.source),
    },
    {
      labelKey: "schemeDetails.targetCategory",
      defaultLabel: "Target Category",
      value: extractTargetCategory(scheme),
    },
  ];

  const ageLimit = extractAgeLimit(scheme);
  if (ageLimit) {
    quickOverview.push({
      labelKey: "schemeDetails.ageLimit",
      defaultLabel: "Age Limit",
      value: ageLimit,
    });
  } else {
    quickOverview.push({
      labelKey: "schemeDetails.jurisdiction",
      defaultLabel: "Jurisdiction",
      value:
        scheme.level === "central"
          ? "Central (Bihar)"
          : `${scheme.state ?? "Bihar"} State`,
    });
  }

  const extraRow = extractExtraOverviewRow(scheme);
  // Avoid duplicating Jurisdiction if ageLimit fell back to Jurisdiction
  if (!quickOverview.some((row) => row.defaultLabel === extraRow.defaultLabel)) {
    quickOverview.push(extraRow);
  }

  return { benefitStats, quickOverview };
}
