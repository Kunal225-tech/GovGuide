/**
 * seedSchemes.ts
 * Populates MongoDB with verified Central and State government welfare schemes
 * and their corresponding eligibility rules across all 9 supported sectors.
 *
 * Usage:
 *   npx ts-node src/scripts/seedSchemes.ts
 */

import mongoose from "mongoose";
import Scheme, { SchemeType, VerificationStatus, SchemeStatus } from "../models/Scheme";
import EligibilityRule from "../models/EligibilityRule";
import { ENV } from "../config/env";

interface SeedSchemeData {
  scheme: {
    name: string;
    description: string;
    category:
      | "Agriculture"
      | "Employment"
      | "Housing"
      | "Healthcare"
      | "Education"
      | "Women & Child"
      | "Financial Assistance"
      | "Social Welfare"
      | "Entrepreneurship";
    level: "central" | "state";
    state?: string;
    benefits: string[];
    eligibility: string[];
    requiredDocuments: string[];
    applicationProcess: string[];
    officialUrl: string;
    source: string;
    schemeType?: SchemeType;
    applicableStates?: string[];
    hasDeterministicRule?: boolean;
    verificationStatus?: VerificationStatus;
    status?: SchemeStatus;
  };
  rule: {
    minAge?: number;
    maxAge?: number;
    maxAnnualIncome?: number;
    states?: string[];
    occupations?: string[];
    educationLevels?: string[];
    categories?: string[];
    genders?: string[];
    isVerified?: boolean;
  };
}

const verifiedSchemesWithRules: SeedSchemeData[] = [
  // 1. Agriculture (Central)
  {
    scheme: {
      name: "PM Kisan Samman Nidhi",
      description:
        "A Central Sector scheme providing income support of Rs. 6000 per year to all landholding farmer families across India. The amount is transferred directly to bank accounts in three equal installments of Rs. 2000.",
      category: "Agriculture",
      level: "central",
      benefits: [
        "Rs. 6000 per year transferred directly to bank account",
        "Payments made in 3 installments of Rs. 2000 each",
        "No middlemen - direct benefit transfer",
      ],
      eligibility: [
        "All landholding farmer families in India",
        "Must have valid Aadhaar card",
        "Land records must be up to date in state land repository",
      ],
      requiredDocuments: [
        "Aadhaar Card",
        "Bank account passbook",
        "Land ownership documents (Khatauni)",
        "Mobile number linked to Aadhaar",
      ],
      applicationProcess: [
        "Visit the official PM Kisan portal or nearest Common Service Centre",
        "Fill in the online registration form",
        "Submit landholding and identity documents",
        "Verification by local revenue authorities",
        "Upon approval, funds are transferred via DBT",
      ],
      officialUrl: "https://pmkisan.gov.in",
      source: "Ministry of Agriculture and Farmers Welfare",
    },
    rule: {
      minAge: 18,
      occupations: ["Farmer", "Agriculture", "Self Employed"],
      maxAnnualIncome: 600000,
    },
  },

  // 2. Employment (Central)
  {
    scheme: {
      name: "Pradhan Mantri Mudra Yojana (PMMY)",
      description:
        "A flagship scheme providing collateral-free loans up to Rs. 10 lakh to non-corporate, non-farm small/micro enterprises across Shishu, Kishore, and Tarun categories.",
      category: "Employment",
      level: "central",
      benefits: [
        "Collateral-free business loans up to Rs. 10 lakh",
        "Subsidized interest rates with flexible repayment terms",
        "Three tiers: Shishu (up to Rs. 50k), Kishore (Rs. 50k-5L), Tarun (Rs. 5L-10L)",
        "No processing fee for Shishu category",
      ],
      eligibility: [
        "Any Indian citizen aged 18 years or above",
        "Non-corporate, non-farm small and micro enterprises",
        "New or existing business initiatives",
      ],
      requiredDocuments: [
        "Identity proof (Aadhaar, Voter ID, Passport)",
        "Proof of business address",
        "Bank statement for previous 6 months",
        "Business project report or proposal",
      ],
      applicationProcess: [
        "Approach any Public Sector Bank, RRB, MFI, or apply online via UdyamiMitra",
        "Submit standard Mudra loan application form with project details",
        "Bank assesses viability and credentials",
        "Loan disbursed directly to business account upon approval",
      ],
      officialUrl: "https://www.mudra.org.in",
      source: "Ministry of Finance, Government of India",
    },
    rule: {
      minAge: 18,
      maxAge: 65,
      occupations: ["Self Employed", "Business", "Artisan", "Trader", "Unemployed"],
    },
  },

  // 3. Housing (Central)
  {
    scheme: {
      name: "PM Awas Yojana - Gramin (PMAY-G)",
      description:
        "Flagship housing mission providing financial assistance to houseless and kutcha house living families in rural areas for construction of durable pucca houses.",
      category: "Housing",
      level: "central",
      benefits: [
        "Financial grant of Rs. 1.20 lakh in plain areas",
        "Financial grant of Rs. 1.30 lakh in hilly and difficult terrains",
        "Toilet construction support under Swachh Bharat Mission",
        "Optional subsidized home loan up to Rs. 70,000",
      ],
      eligibility: [
        "Houseless families or living in 0 or 1-room kutcha houses",
        "Families identified through SECC 2011 and Awaas+ surveys",
        "No pucca house owned by any family member across India",
      ],
      requiredDocuments: [
        "Aadhaar Card",
        "Bank passbook linked to Aadhaar",
        "SECC / Awaas+ registration reference",
        "Land possession or homestead certificate",
      ],
      applicationProcess: [
        "Verify beneficiary status in Gram Panchayat permanent waitlist",
        "Register through AwaasSoft portal via Block Development Officer",
        "Geo-tagging of site before and during house construction stages",
        "Direct installment transfer directly into beneficiary account",
      ],
      officialUrl: "https://pmayg.nic.in",
      source: "Ministry of Rural Development, Government of India",
    },
    rule: {
      maxAnnualIncome: 300000,
      categories: ["General", "OBC", "SC", "ST"],
    },
  },

  // 4. Healthcare (Central)
  {
    scheme: {
      name: "Ayushman Bharat - PM Jan Arogya Yojana",
      description:
        "World's largest government-funded health assurance scheme providing comprehensive coverage of Rs. 5 lakh per family per year for secondary and tertiary care hospitalization.",
      category: "Healthcare",
      level: "central",
      benefits: [
        "Health cover of Rs. 5 lakh per family per year",
        "Cashless and paperless access at empanelled public and private hospitals",
        "Covers pre-existing conditions from day one",
        "Includes diagnostic tests, medications, and post-hospitalization costs",
      ],
      eligibility: [
        "Families identified under rural and urban SECC deprivation criteria",
        "All senior citizens aged 70 and above regardless of income (under expansion)",
        "No limit on family size, gender, or age",
      ],
      requiredDocuments: [
        "Aadhaar Card",
        "Ration Card / Family identity document",
        "Active mobile number",
      ],
      applicationProcess: [
        "Verify entitlement on mera.pmjay.gov.in or by calling 14555",
        "Visit nearest Common Service Centre or PMJAY kiosk at empanelled hospital",
        "Complete biometric e-KYC to generate Ayushman Card (Golden Card)",
        "Show card at hospital helpdesk for cashless admission",
      ],
      officialUrl: "https://pmjay.gov.in",
      source: "National Health Authority, Ministry of Health and Family Welfare",
    },
    rule: {
      maxAnnualIncome: 500000,
    },
  },

  // 5. Education (Central)
  {
    scheme: {
      name: "Pradhan Mantri Scholarship Scheme",
      description:
        "Provides monthly scholarships to dependent wards and widows of ex-servicemen and ex-Coast Guard personnel pursuing professional and technical degree courses.",
      category: "Education",
      level: "central",
      benefits: [
        "Rs. 3000 per month for male students",
        "Rs. 3500 per month for female students",
        "Tenure from 1 to 5 years depending on degree duration",
        "Disbursed directly into student's bank account",
      ],
      eligibility: [
        "Dependent children or widows of deceased/ex-servicemen personnel",
        "Minimum 60% marks in 10+2 or diploma qualifying examination",
        "Enrolled in recognized technical or professional degree course",
      ],
      requiredDocuments: [
        "Service / Discharge book of parent",
        "Mark sheet of minimum qualifying examination",
        "Bonafide student certificate from college/university",
        "Bank account passbook",
      ],
      applicationProcess: [
        "Register on Kendriya Sainik Board portal (ksb.gov.in)",
        "Submit online application form with verified academic credentials",
        "Verification by Zila Sainik Welfare Board (ZSB)",
        "Scholarship sanctioned by KSB Executive Committee",
      ],
      officialUrl: "https://ksb.gov.in",
      source: "Kendriya Sainik Board, Ministry of Defence",
    },
    rule: {
      minAge: 17,
      maxAge: 26,
      educationLevels: ["12th Pass", "Undergraduate", "Graduate"],
    },
  },

  // 6. Women & Child (Central)
  {
    scheme: {
      name: "Sukanya Samriddhi Yojana",
      description:
        "A government-backed small savings program under Beti Bachao Beti Padhao campaign that offers high interest and tax exemptions to secure the future of the girl child.",
      category: "Women & Child",
      level: "central",
      benefits: [
        "High government guaranteed interest rate (8.2% p.a.)",
        "Full tax exemption under Section 80C on deposits and maturity",
        "Partial withdrawal allowed after age 18 for higher education",
        "Account matures after 21 years from opening date",
      ],
      eligibility: [
        "Girl child who is an Indian resident and aged below 10 years",
        "Account opened by biological parents or legal guardian",
        "Maximum 2 accounts per family (exception for twins/triplets)",
      ],
      requiredDocuments: [
        "Birth certificate of the girl child",
        "Identity proof of guardian (Aadhaar, PAN card)",
        "Address proof of guardian",
        "Photographs of guardian and girl child",
      ],
      applicationProcess: [
        "Visit any Post Office branch or authorized commercial bank",
        "Fill out SSY account opening form-1",
        "Submit required documents and initial minimum deposit of Rs. 250",
        "Receive passbook for tracking yearly contributions",
      ],
      officialUrl: "https://www.indiapost.gov.in",
      source: "Ministry of Finance, Government of India",
    },
    rule: {
      minAge: 0,
      maxAge: 10,
      genders: ["Female"],
    },
  },

  // 7. Financial Assistance (Central)
  {
    scheme: {
      name: "PM SVANidhi (Street Vendor Financial Assistance)",
      description:
        "Special micro-credit facility providing affordable working capital loans to urban and peri-urban street vendors to restart their livelihoods.",
      category: "Financial Assistance",
      level: "central",
      benefits: [
        "Initial working capital loan of Rs. 10,000 without collateral",
        "Enhanced loan of Rs. 20,000 on timely repayment, up to Rs. 50,000 in 3rd tranche",
        "Interest subsidy at 7% credited to bank account quarterly",
        "Cashback incentives on digital transactions up to Rs. 1,200 per year",
      ],
      eligibility: [
        "Street vendors possessing Certificate of Vending or Urban Local Body ID",
        "Vendors surveyed in ULB identification drives",
        "Active vendors from urban, semi-urban, or rural surrounding areas",
      ],
      requiredDocuments: [
        "Aadhaar Card",
        "Vending Certificate or Letter of Recommendation from ULB",
        "Bank account passbook",
      ],
      applicationProcess: [
        "Apply online through pmsvanidhi.mohua.gov.in or PM SVANidhi mobile app",
        "Select preferred lending institution or nearby bank branch",
        "Verification by Urban Local Body nodal officer",
        "Direct loan disbursal upon approval without physical bank visit required",
      ],
      officialUrl: "https://pmsvanidhi.mohua.gov.in",
      source: "Ministry of Housing and Urban Affairs",
    },
    rule: {
      minAge: 18,
      occupations: ["Self Employed", "Street Vendor", "Artisan", "Trader", "Informal Worker"],
      maxAnnualIncome: 350000,
    },
  },

  // 8. Social Welfare (Central)
  {
    scheme: {
      name: "Indira Gandhi National Old Age Pension Scheme",
      description:
        "A core social welfare program providing monthly social security pensions to senior citizens living below the poverty line.",
      category: "Social Welfare",
      level: "central",
      benefits: [
        "Monthly pension directly credited to beneficiary bank or post office account",
        "Additional state contribution added on top of central base grant",
        "Special enhanced amount for super-senior citizens aged 80 and above",
      ],
      eligibility: [
        "Indian citizens aged 60 years or older",
        "Applicant must belong to Below Poverty Line (BPL) household",
        "Recognized on state BPL or SECC registry",
      ],
      requiredDocuments: [
        "Aadhaar Card",
        "Age proof (Birth certificate, Voter ID, or medical board certificate)",
        "Valid BPL Card / Ration Card",
        "Bank account details linked to Aadhaar",
      ],
      applicationProcess: [
        "Obtain pension application form from Block Development Officer or Gram Panchayat",
        "Submit duly filled form with age and BPL proofs",
        "Verification by Social Welfare officer",
        "Sanction order issued and monthly pension disbursed through DBT",
      ],
      officialUrl: "https://nsap.nic.in",
      source: "Ministry of Rural Development, Government of India",
    },
    rule: {
      minAge: 60,
      maxAnnualIncome: 200000,
    },
  },

  // 9. Entrepreneurship (Central)
  {
    scheme: {
      name: "Startup India Seed Fund Scheme (SISFS)",
      description:
        "Financial assistance to early-stage startups for proof of concept, prototype development, product trials, market entry, and commercialization.",
      category: "Entrepreneurship",
      level: "central",
      benefits: [
        "Grants up to Rs. 20 lakh for proof of concept and prototype development",
        "Debt/convertible debenture investment up to Rs. 50 lakh for commercialization",
        "Mentorship and incubator support through recognized incubators",
      ],
      eligibility: [
        "DPIIT-recognized startup incorporated not more than 2 years ago",
        "Must have a viable business idea utilizing technology or innovation",
        "Indian promoters must hold at least 51% shareholding",
      ],
      requiredDocuments: [
        "DPIIT Certificate of Recognition",
        "Company Incorporation Certificate & PAN",
        "Pitch deck and project proposal",
        "Audited accounts or bank statements",
      ],
      applicationProcess: [
        "Apply online on seedfund.startupindia.gov.in portal",
        "Select up to 3 preference incubators across India",
        "Incubator evaluation committee screens presentations",
        "Funds sanctioned in tranches linked to milestone achievements",
      ],
      officialUrl: "https://seedfund.startupindia.gov.in",
      source: "Department for Promotion of Industry and Internal Trade (DPIIT)",
    },
    rule: {
      minAge: 18,
      occupations: ["Entrepreneur", "Business", "Student", "Self Employed"],
    },
  },

  // 10. Employment (State - Karnataka)
  {
    scheme: {
      name: "Karnataka Yuva Nidhi Scheme",
      description:
        "State unemployment financial allowance scheme providing monthly assistance to educated unemployed youth of Karnataka to support skill enhancement and job search.",
      category: "Employment",
      level: "state",
      state: "Karnataka",
      benefits: [
        "Rs. 3000 per month for unemployed degree graduates",
        "Rs. 1500 per month for unemployed diploma holders",
        "Assistance provided for a maximum duration of two years",
        "Free skill development training access",
      ],
      eligibility: [
        "Permanent resident of Karnataka domicile",
        "Graduated or completed diploma in the recognized academic year",
        "Remained unemployed for at least 6 months after passing course",
        "Not pursuing higher education or employed in private/govt sector",
      ],
      requiredDocuments: [
        "Karnataka Domicile / Residence Certificate",
        "Aadhaar Card",
        "Degree or Diploma completion certificate and marks cards",
        "Bank account passbook (Aadhaar seeded)",
      ],
      applicationProcess: [
        "Register on Karnataka Seva Sindhu portal (sevasindhu.karnataka.gov.in)",
        "Authenticate through Aadhaar and enter degree registration number",
        "Submit self-declaration of unemployment status",
        "Monthly DBT payment credited directly into bank account",
      ],
      officialUrl: "https://sevasindhu.karnataka.gov.in",
      source: "Department of Skill Development, Government of Karnataka",
    },
    rule: {
      minAge: 20,
      maxAge: 35,
      states: ["Karnataka"],
      occupations: ["Unemployed", "Student"],
      educationLevels: ["Graduate", "Post Graduate", "Diploma", "Undergraduate"],
    },
  },

  // 11. Women & Child (State - Karnataka)
  {
    scheme: {
      name: "Karnataka Gruha Lakshmi Scheme",
      description:
        "Flagship Karnataka welfare guarantee scheme providing financial empowerment of Rs. 2000 per month to woman head of households across the state.",
      category: "Women & Child",
      level: "state",
      state: "Karnataka",
      benefits: [
        "Rs. 2000 monthly financial assistance transferred via DBT",
        "Directly empowers woman head of the family",
        "No limit on tenure as long as eligibility conditions hold",
      ],
      eligibility: [
        "Woman head of household as recognized in Antyodaya/BPL/APL ration card",
        "Only one woman eligible per family/ration card",
        "Woman or her husband must not be an income tax or GST payer",
      ],
      requiredDocuments: [
        "Ration Card (APL/BPL/AAY)",
        "Aadhaar Card of the woman head",
        "Aadhaar-seeded active bank account",
      ],
      applicationProcess: [
        "Visit Grama One, Karnataka One, or Bangalore One centres",
        "Submit Ration Card number for instant verification",
        "Biometric or OTP authentication through Aadhaar",
        "Monthly grant disbursed on fixed cycle every month",
      ],
      officialUrl: "https://sevasindhugs.karnataka.gov.in",
      source: "Department of Women and Child Development, Government of Karnataka",
    },
    rule: {
      minAge: 18,
      states: ["Karnataka"],
      genders: ["Female"],
      maxAnnualIncome: 500000,
    },
  },

  // 12. Financial Assistance (State - Maharashtra)
  {
    scheme: {
      name: "Mukhyamantri Majhi Ladki Bahin Yojana",
      description:
        "Maharashtra state welfare initiative offering direct monthly financial support of Rs. 1500 to women from economically disadvantaged families.",
      category: "Financial Assistance",
      level: "state",
      state: "Maharashtra",
      benefits: [
        "Rs. 1500 monthly financial grant directly into bank account",
        "Supports nutrition, health, and economic independence of women",
        "Regular monthly DBT disbursement",
      ],
      eligibility: [
        "Resident woman of Maharashtra state aged 21 to 65 years",
        "Annual family income must not exceed Rs. 2.5 lakh",
        "Holding valid yellow or orange ration card",
      ],
      requiredDocuments: [
        "Aadhaar Card",
        "Maharashtra Domicile Certificate or Ration Card",
        "Income Certificate (under Rs. 2.5 lakh)",
        "Bank account passbook with Aadhaar linkage",
      ],
      applicationProcess: [
        "Apply via Nari Shakti Doot mobile application or Setu Suvidha Kendra",
        "Upload Aadhaar, domicile, and ration card details",
        "Verification by Anganwadi workers and local revenue committee",
        "Direct benefit credit upon approval",
      ],
      officialUrl: "https://ladkibahin.maharashtra.gov.in",
      source: "Women and Child Development Department, Government of Maharashtra",
    },
    rule: {
      minAge: 21,
      maxAge: 65,
      states: ["Maharashtra"],
      genders: ["Female"],
      maxAnnualIncome: 250000,
    },
  },

  // 13. Social Welfare (State - Uttar Pradesh)
  {
    scheme: {
      name: "Mukhyamantri Kanya Sumangala Yojana",
      description:
        "Conditional cash transfer scheme of Uttar Pradesh government providing financial support up to Rs. 25,000 in stages from birth to graduation of a girl child.",
      category: "Social Welfare",
      level: "state",
      state: "Uttar Pradesh",
      benefits: [
        "Total financial assistance of Rs. 25,000 provided across six milestones",
        "Support covers birth, full immunization, school admission, and higher studies",
        "Funds deposited directly into girl child or mother's account",
      ],
      eligibility: [
        "Permanent resident of Uttar Pradesh with valid domicile",
        "Family annual income should not exceed Rs. 3,00,000",
        "Maximum two girl children eligible per family",
      ],
      requiredDocuments: [
        "UP Domicile Certificate",
        "Aadhaar Card of parents and child",
        "Income certificate issued by competent authority",
        "Birth certificate / School enrollment certificate as per stage",
      ],
      applicationProcess: [
        "Apply online on the official portal mksy.up.gov.in",
        "Register family head profile and add beneficiary child details",
        "Upload required stage-specific documents",
        "Verification by Block Development Officer or Sub-Divisional Magistrate",
      ],
      officialUrl: "https://mksy.up.gov.in",
      source: "Department of Women and Child Development, Government of Uttar Pradesh",
    },
    rule: {
      minAge: 0,
      maxAge: 25,
      states: ["Uttar Pradesh"],
      genders: ["Female"],
      maxAnnualIncome: 300000,
    },
  },
];

async function seed(): Promise<void> {
  try {
    console.log(`Connecting to MongoDB at: ${ENV.MONGODB_URI}...`);
    await mongoose.connect(ENV.MONGODB_URI);
    console.log("MongoDB connection established.");

    console.log("Upserting verified schemes and corresponding eligibility rules...");

    let schemesCreatedOrUpdated = 0;
    let rulesCreatedOrUpdated = 0;

    for (const item of verifiedSchemesWithRules) {
      // Upsert scheme by unique name to preserve stability and avoid orphaned references
      const schemeDoc = await Scheme.findOneAndUpdate(
        { name: item.scheme.name },
        {
          $set: {
            hasDeterministicRule: true,
            verificationStatus: "verified",
            status: "active",
            ...item.scheme,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      schemesCreatedOrUpdated++;

      // Upsert corresponding EligibilityRule linked to this scheme
      await EligibilityRule.findOneAndUpdate(
        { schemeId: schemeDoc._id },
        {
          $set: {
            schemeId: schemeDoc._id,
            isVerified: true,
            ...item.rule,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      rulesCreatedOrUpdated++;
    }

    console.log("==================================================");
    console.log(`Successfully synced ${schemesCreatedOrUpdated} schemes across Central and State levels!`);
    console.log(`Successfully synced ${rulesCreatedOrUpdated} corresponding EligibilityRules!`);
    console.log("Covered categories: Agriculture, Employment, Housing, Healthcare, Education, Women & Child, Financial Assistance, Social Welfare, Entrepreneurship.");
    console.log("==================================================");

    await mongoose.disconnect();
    console.log("Database disconnected cleanly. Seeding complete.");
  } catch (err) {
    console.error("Seeding operation failed:", err);
    process.exit(1);
  }
}

seed();
