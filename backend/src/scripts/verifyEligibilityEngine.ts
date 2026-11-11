/**
 * verifyEligibilityEngine.ts
 *
 * Comprehensive Automated Verification Suite for GovGuide's Deterministic Eligibility Engine.
 * Tests every evaluation vector, edge case, and safety gate in checkEligibility().
 */

import mongoose from "mongoose";
import User from "../models/User";
import Scheme from "../models/Scheme";
import EligibilityRule from "../models/EligibilityRule";
import { checkEligibility } from "../services/eligibilityService";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string): void {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
  }
}

// Helper to mock MongoDB models for checkEligibility
function setupMockData(userProfile: any, schemes: any[], rules: any[]) {
  (User as any).findById = async (id: string) => {
    return {
      _id: new mongoose.Types.ObjectId(id),
      profile: userProfile,
    };
  };

  (Scheme as any).find = () => {
    return {
      sort: () => Promise.resolve(schemes),
    };
  };

  (EligibilityRule as any).find = async () => {
    return rules;
  };
}

async function runVerification() {
  console.log("======================================================================");
  console.log("   GovGuide Deterministic Eligibility Engine Verification Suite      ");
  console.log("======================================================================\n");

  const dummyUserId = new mongoose.Types.ObjectId().toString();

  // -------------------------------------------------------------------------
  // SUITE 1: Age Boundary Checks
  // -------------------------------------------------------------------------
  console.log("🔷 Suite 1: Age Boundary & Edge Case Checks");
  {
    const schemeId = new mongoose.Types.ObjectId();
    const mockScheme = {
      _id: schemeId,
      name: "Youth Fellowship Scheme",
      status: "active",
      hasDeterministicRule: true,
      level: "central",
    };
    const mockRule = {
      _id: new mongoose.Types.ObjectId(),
      schemeId: schemeId,
      minAge: 18,
      maxAge: 25,
      isVerified: true,
      isComplete: true,
    };

    // 1.1 Underage (< 18)
    setupMockData({ age: 17 }, [mockScheme], [mockRule]);
    let [res] = await checkEligibility(dummyUserId);
    assert(res.status === "ineligible" && res.eligible === false, "Citizen under minAge (17 < 18) is marked ineligible");
    assert(res.reasons.some(r => r.includes("below the minimum required age of 18")), "Accurate reason given for underage disqualification");

    // 1.2 Exact minimum boundary (18)
    setupMockData({ age: 18 }, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "eligible" && res.eligible === true, "Citizen at exact minAge boundary (18) is eligible");

    // 1.3 Within range (21)
    setupMockData({ age: 21 }, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "eligible" && res.eligible === true, "Citizen inside age window (21) is eligible");

    // 1.4 Exact maximum boundary (25)
    setupMockData({ age: 25 }, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "eligible" && res.eligible === true, "Citizen at exact maxAge boundary (25) is eligible");

    // 1.5 Overage (> 25)
    setupMockData({ age: 26 }, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "ineligible" && res.eligible === false, "Citizen over maxAge (26 > 25) is marked ineligible");
    assert(res.reasons.some(r => r.includes("exceeds the maximum eligible age of 25")), "Accurate reason given for overage disqualification");

    // 1.6 Missing age in profile
    setupMockData({}, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "unverified" && res.eligible === false, "Missing age in profile marks scheme as unverified");
    assert(res.missingProfileFields?.includes("age") === true, "missingProfileFields includes 'age'");
  }

  // -------------------------------------------------------------------------
  // SUITE 2: Income Ceiling Checks
  // -------------------------------------------------------------------------
  console.log("\n🔷 Suite 2: Income Ceiling Checks");
  {
    const schemeId = new mongoose.Types.ObjectId();
    const mockScheme = {
      _id: schemeId,
      name: "EWS Subsidy",
      status: "active",
      hasDeterministicRule: true,
      level: "central",
    };
    const mockRule = {
      _id: new mongoose.Types.ObjectId(),
      schemeId: schemeId,
      maxAnnualIncome: 300000,
      isVerified: true,
      isComplete: true,
    };

    // 2.1 Income under ceiling
    setupMockData({ annualIncome: 250000 }, [mockScheme], [mockRule]);
    let [res] = await checkEligibility(dummyUserId);
    assert(res.status === "eligible" && res.eligible === true, "Income under ceiling (₹2,50,000 <= ₹3,00,000) is eligible");

    // 2.2 Income exactly at ceiling
    setupMockData({ annualIncome: 300000 }, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "eligible" && res.eligible === true, "Income at exact ceiling (₹3,00,000) is eligible");

    // 2.3 Income exceeding ceiling
    setupMockData({ annualIncome: 350000 }, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "ineligible" && res.eligible === false, "Income above ceiling (₹3,50,000 > ₹3,00,000) is ineligible");
    assert(res.reasons.some(r => r.includes("exceeds the upper ceiling of ₹3,00,000")), "Reason mentions formatted currency limit");

    // 2.4 Missing income
    setupMockData({}, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "unverified" && res.eligible === false, "Missing annualIncome results in unverified status");
    assert(res.missingProfileFields?.includes("annualIncome") === true, "missingProfileFields includes 'annualIncome'");
  }

  // -------------------------------------------------------------------------
  // SUITE 3: State Residency & Geographic Scoping
  // -------------------------------------------------------------------------
  console.log("\n🔷 Suite 3: State & Geographic Scoping");
  {
    const schemeId = new mongoose.Types.ObjectId();
    const mockScheme = {
      _id: schemeId,
      name: "Karnataka Yuva Nidhi",
      status: "active",
      hasDeterministicRule: true,
      level: "state",
      state: "Karnataka",
    };
    const mockRule = {
      _id: new mongoose.Types.ObjectId(),
      schemeId: schemeId,
      states: ["Karnataka"],
      isVerified: true,
      isComplete: true,
    };

    // 3.1 Correct state match
    setupMockData({ state: "Karnataka" }, [mockScheme], [mockRule]);
    let [res] = await checkEligibility(dummyUserId);
    assert(res.status === "eligible" && res.eligible === true, "Matching state resident is eligible");

    // 3.2 Case-insensitivity check ("karnataka")
    setupMockData({ state: "karnataka" }, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "eligible" && res.eligible === true, "State matching is case-insensitive ('karnataka' matches 'Karnataka')");

    // 3.3 State mismatch
    setupMockData({ state: "Tamil Nadu" }, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "ineligible" && res.eligible === false, "Mismatched state resident is ineligible");
    assert(res.reasons.some(r => r.includes("Scheme is restricted to residents of: Karnataka")), "Accurate residency requirement reason given");

    // 3.4 All-states Central Scheme
    const centralSchemeId = new mongoose.Types.ObjectId();
    const mockCentralScheme = {
      _id: centralSchemeId,
      name: "National Career Service",
      status: "active",
      hasDeterministicRule: true,
      level: "central",
    };
    const mockCentralRule = {
      _id: new mongoose.Types.ObjectId(),
      schemeId: centralSchemeId,
      states: ["All"],
      minAge: 18,
      isVerified: true,
      isComplete: true,
    };
    setupMockData({ state: "Bihar", age: 20 }, [mockCentralScheme], [mockCentralRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "eligible" && res.eligible === true, "States: ['All'] does not restrict residency for citizens of any state");
  }

  // -------------------------------------------------------------------------
  // SUITE 4: Gender Filtering
  // -------------------------------------------------------------------------
  console.log("\n🔷 Suite 4: Gender Filtering");
  {
    const schemeId = new mongoose.Types.ObjectId();
    const mockScheme = {
      _id: schemeId,
      name: "Sukanya Samriddhi Yojana",
      status: "active",
      hasDeterministicRule: true,
      level: "central",
    };
    const mockRule = {
      _id: new mongoose.Types.ObjectId(),
      schemeId: schemeId,
      genders: ["Female"],
      maxAge: 10,
      isVerified: true,
      isComplete: true,
    };

    // 4.1 Female qualifies
    setupMockData({ gender: "Female", age: 5 }, [mockScheme], [mockRule]);
    let [res] = await checkEligibility(dummyUserId);
    assert(res.status === "eligible" && res.eligible === true, "Female profile qualifies for female-only scheme");

    // 4.2 Male fails
    setupMockData({ gender: "Male", age: 5 }, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "ineligible" && res.eligible === false, "Male profile is ineligible for female-only scheme");
    assert(res.reasons.some(r => r.includes("Gender criteria not met")), "Gender disqualification reason provided");

    // 4.3 Missing gender
    setupMockData({ age: 5 }, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "unverified" && res.eligible === false, "Missing gender results in unverified status");
    assert(res.missingProfileFields?.includes("gender") === true, "missingProfileFields includes 'gender'");
  }

  // -------------------------------------------------------------------------
  // SUITE 5: Occupation, Education & Category Criteria
  // -------------------------------------------------------------------------
  console.log("\n🔷 Suite 5: Occupation, Education & Social Category");
  {
    const schemeId = new mongoose.Types.ObjectId();
    const mockScheme = {
      _id: schemeId,
      name: "Post-Matric Scholarship for SC/ST Students",
      status: "active",
      hasDeterministicRule: true,
      level: "central",
    };
    const mockRule = {
      _id: new mongoose.Types.ObjectId(),
      schemeId: schemeId,
      occupations: ["Student"],
      educationLevels: ["Undergraduate", "Post Graduate"],
      categories: ["SC", "ST"],
      isVerified: true,
      isComplete: true,
    };

    // 5.1 Fully matching
    setupMockData({ occupation: "Student", education: "Undergraduate", category: "SC" }, [mockScheme], [mockRule]);
    let [res] = await checkEligibility(dummyUserId);
    assert(res.status === "eligible" && res.eligible === true, "Citizen matching Occupation, Education, and Category qualifies");

    // 5.2 Category mismatch (General vs SC/ST)
    setupMockData({ occupation: "Student", education: "Undergraduate", category: "General" }, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "ineligible" && res.eligible === false, "Mismatched social category is marked ineligible");
    assert(res.reasons.some(r => r.includes("Social category criteria not met")), "Category disqualification reason provided");

    // 5.3 Occupation mismatch (Employed vs Student)
    setupMockData({ occupation: "Employed", education: "Undergraduate", category: "SC" }, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "ineligible" && res.eligible === false, "Mismatched occupation is marked ineligible");
    assert(res.reasons.some(r => r.includes("Occupation criteria not met")), "Occupation disqualification reason provided");

    // 5.4 Education mismatch (10th Pass vs Undergraduate)
    setupMockData({ occupation: "Student", education: "10th Pass", category: "SC" }, [mockScheme], [mockRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "ineligible" && res.eligible === false, "Mismatched education level is marked ineligible");
    assert(res.reasons.some(r => r.includes("Education criteria not met")), "Education disqualification reason provided");
  }

  // -------------------------------------------------------------------------
  // SUITE 6: Safety Gates & Zero-False-Positive Protections
  // -------------------------------------------------------------------------
  console.log("\n🔷 Suite 6: Safety Gates & Zero-False-Positive Protections");
  {
    // 6.1 Discontinued Scheme Gate
    const discSchemeId = new mongoose.Types.ObjectId();
    const discScheme = {
      _id: discSchemeId,
      name: "Old Discontinued Scheme",
      status: "discontinued",
      hasDeterministicRule: true,
      level: "central",
    };
    const discRule = {
      _id: new mongoose.Types.ObjectId(),
      schemeId: discSchemeId,
      minAge: 18,
      isVerified: true,
      isComplete: true,
    };
    setupMockData({ age: 25 }, [discScheme], [discRule]);
    let [res] = await checkEligibility(dummyUserId);
    assert(res.status === "ineligible" && res.eligible === false, "Discontinued scheme is ALWAYS ineligible even when demographics match");
    assert(res.reasons.some(r => r.includes("has been discontinued")), "States scheme has been discontinued");

    // 6.2 Missing Rule Gate (Scheme in DB, but no EligibilityRule record)
    const noRuleSchemeId = new mongoose.Types.ObjectId();
    const noRuleScheme = {
      _id: noRuleSchemeId,
      name: "Unregulated Scheme",
      status: "active",
      hasDeterministicRule: true,
      level: "central",
    };
    setupMockData({ age: 25 }, [noRuleScheme], []);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "unverified" && res.eligible === false, "Missing EligibilityRule NEVER marks scheme as eligible (defaults to unverified)");
    assert(res.reasons.some(r => r.includes("has not been verified for automated evaluation")), "States rule is not verified for automation");

    // 6.3 Scheme with hasDeterministicRule = false
    const nonDetSchemeId = new mongoose.Types.ObjectId();
    const nonDetScheme = {
      _id: nonDetSchemeId,
      name: "Complex Discretionary Scheme",
      status: "active",
      hasDeterministicRule: false,
      level: "central",
    };
    const nonDetRule = {
      _id: new mongoose.Types.ObjectId(),
      schemeId: nonDetSchemeId,
      minAge: 18,
      isVerified: true,
      isComplete: true,
    };
    setupMockData({ age: 25 }, [nonDetScheme], [nonDetRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "unverified" && res.eligible === false, "hasDeterministicRule: false marks scheme as unverified");

    // 6.4 Rule with isVerified = false
    const unverifiedRuleId = new mongoose.Types.ObjectId();
    const normScheme = {
      _id: unverifiedRuleId,
      name: "Pending Ministry Verification Scheme",
      status: "active",
      hasDeterministicRule: true,
      level: "central",
    };
    const unverifiedRule = {
      _id: new mongoose.Types.ObjectId(),
      schemeId: unverifiedRuleId,
      minAge: 18,
      isVerified: false,
      isComplete: true,
    };
    setupMockData({ age: 25 }, [normScheme], [unverifiedRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "unverified" && res.eligible === false, "isVerified: false marks scheme as unverified");

    // 6.5 Unsupported Non-Demographic Criteria Gate (e.g. Landholding)
    const unsupportedSchemeId = new mongoose.Types.ObjectId();
    const pmKisanMock = {
      _id: unsupportedSchemeId,
      name: "PM Kisan Samman Nidhi",
      status: "active",
      hasDeterministicRule: true,
      level: "central",
    };
    const pmKisanRule = {
      _id: new mongoose.Types.ObjectId(),
      schemeId: unsupportedSchemeId,
      occupations: ["Farmer"],
      isVerified: true,
      isComplete: false,
      hasUnsupportedCriteria: true,
      unsupportedCriteria: ["Cultivable landholding proof", "Land records linkage"],
    };
    setupMockData({ occupation: "Farmer" }, [pmKisanMock], [pmKisanRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "unverified" && res.eligible === false, "Scheme with unsupported criteria is marked unverified even if demographics match");
    assert(res.reasons.some(r => r.includes("Cultivable landholding proof")), "Cites specific unsupported criteria in explanation");

    // 6.6 Zero Demographic Criteria Configured
    const emptyRuleSchemeId = new mongoose.Types.ObjectId();
    const emptyRuleScheme = {
      _id: emptyRuleSchemeId,
      name: "Vague Scheme",
      status: "active",
      hasDeterministicRule: true,
      level: "central",
    };
    const emptyRule = {
      _id: new mongoose.Types.ObjectId(),
      schemeId: emptyRuleSchemeId,
      isVerified: true,
      isComplete: true,
    };
    setupMockData({ age: 25 }, [emptyRuleScheme], [emptyRule]);
    [res] = await checkEligibility(dummyUserId);
    assert(res.status === "unverified" && res.eligible === false, "Rule with zero criteria configured defaults safely to unverified");
  }

  // -------------------------------------------------------------------------
  // SUITE 7: Multi-Reason Aggregation
  // -------------------------------------------------------------------------
  console.log("\n🔷 Suite 7: Multi-Reason Disqualification Aggregation");
  {
    const schemeId = new mongoose.Types.ObjectId();
    const mockScheme = {
      _id: schemeId,
      name: "Strict Target Scheme",
      status: "active",
      hasDeterministicRule: true,
      level: "state",
      state: "Karnataka",
    };
    const mockRule = {
      _id: new mongoose.Types.ObjectId(),
      schemeId: schemeId,
      minAge: 18,
      maxAge: 30,
      maxAnnualIncome: 200000,
      states: ["Karnataka"],
      isVerified: true,
      isComplete: true,
    };

    // Citizen fails on age, income, and state simultaneously
    setupMockData({ age: 45, annualIncome: 500000, state: "Delhi" }, [mockScheme], [mockRule]);
    const [res] = await checkEligibility(dummyUserId);
    assert(res.status === "ineligible" && res.eligible === false, "Candidate failing multiple criteria is marked ineligible");
    assert(res.reasons.length === 3, "Engine aggregates ALL 3 distinct disqualification reasons");
    assert(res.reasons.some(r => r.includes("exceeds the maximum eligible age")), "Includes age reason");
    assert(res.reasons.some(r => r.includes("exceeds the upper ceiling of ₹2,00,000")), "Includes income reason");
    assert(res.reasons.some(r => r.includes("restricted to residents of: Karnataka")), "Includes state residency reason");
  }

  // -------------------------------------------------------------------------
  // SUITE 8: Live Verified Pilot Dataset Realistic Persona Scenarios
  // -------------------------------------------------------------------------
  console.log("\n🔷 Suite 8: Realistic Persona Checks Against Actual Pilot Schemes");
  {
    const fs = require("fs");
    const path = require("path");
    const pilotDataPath = path.resolve(__dirname, "../../../data/pilot/verified_pilot_schemes.json");
    const pilotSchemesRaw = JSON.parse(fs.readFileSync(pilotDataPath, "utf8"));

    const pilotSchemes = pilotSchemesRaw.map((s: any) => ({
      ...s,
      _id: new mongoose.Types.ObjectId(),
    }));

    const pilotRules = pilotSchemes.map((s: any) => ({
      _id: new mongoose.Types.ObjectId(),
      schemeId: s._id,
      ...s.rule,
    }));

    // Persona A: 15-year-old Male student from Maharashtra
    setupMockData({ age: 15, gender: "Male", state: "Maharashtra", occupation: "Student" }, pilotSchemes, pilotRules);
    let allResults = await checkEligibility(dummyUserId);

    const ssyResult = allResults.find(r => r.schemeName === "Sukanya Samriddhi Yojana");
    assert(ssyResult?.status === "ineligible", "15yo Male is strictly ineligible for Sukanya Samriddhi Yojana");
    assert(Boolean(ssyResult?.reasons.some(r => r.includes("Gender criteria not met"))), "SSY disqualification cites gender");
    assert(Boolean(ssyResult?.reasons.some(r => r.includes("exceeds the maximum eligible age of 10"))), "SSY disqualification cites age > 10");

    const gruhaLakshmiResult = allResults.find(r => r.schemeName === "Karnataka Gruha Lakshmi Scheme");
    assert(gruhaLakshmiResult?.status === "ineligible", "Male Maharashtra resident is strictly ineligible for Karnataka Gruha Lakshmi");
    assert(Boolean(gruhaLakshmiResult?.reasons.some(r => r.includes("restricted to residents of: Karnataka"))), "Gruha Lakshmi cites state requirement");
    assert(Boolean(gruhaLakshmiResult?.reasons.some(r => r.includes("Gender criteria not met"))), "Gruha Lakshmi cites gender requirement");

    // Persona B: 6-year-old Female child from Uttar Pradesh
    setupMockData({ age: 6, gender: "Female", state: "Uttar Pradesh" }, pilotSchemes, pilotRules);
    allResults = await checkEligibility(dummyUserId);

    const ssyGirlResult = allResults.find(r => r.schemeName === "Sukanya Samriddhi Yojana");
    assert(ssyGirlResult?.status === "unverified", "Eligible age/gender girl child is marked unverified for SSY due to external documentary criteria");
    assert(Boolean(ssyGirlResult?.reasons.some(r => r.includes("additional conditions"))), "SSY prompts citizen to verify external guardianship/birth documents");

    // Persona C: High-income executive (Income: ₹12,00,000) from Karnataka
    setupMockData({ age: 35, annualIncome: 1200000, state: "Karnataka", occupation: "Employed" }, pilotSchemes, pilotRules);
    allResults = await checkEligibility(dummyUserId);

    const pmaygResult = allResults.find(r => r.schemeName === "Pradhan Mantri Awas Yojana - Gramin");
    assert(pmaygResult?.status === "ineligible", "High-income applicant is ineligible for PMAY-G");
    assert(Boolean(pmaygResult?.reasons.some(r => r.includes("exceeds the upper ceiling of ₹1,80,000"))), "PMAY-G accurately flags income ceiling violation");

    const abpmjayResult = allResults.find(r => r.schemeName === "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana");
    assert(abpmjayResult?.status === "ineligible", "High-income applicant is ineligible for Ayushman Bharat (cap ₹2,50,000)");
    assert(Boolean(abpmjayResult?.reasons.some(r => r.includes("exceeds the upper ceiling of ₹2,50,000"))), "Ayushman Bharat accurately flags income ceiling violation");

    // Persona D: Incomplete Profile (Empty citizen)
    setupMockData({}, pilotSchemes, pilotRules);
    allResults = await checkEligibility(dummyUserId);

    const allUnverifiedOrIneligible = allResults.every(r => r.status === "unverified" || r.status === "ineligible");
    const noneEligible = allResults.every(r => r.eligible === false);
    assert(allUnverifiedOrIneligible && noneEligible, "Empty profile user NEVER receives false-positive eligible: true on any scheme");
  }

  // -------------------------------------------------------------------------
  // SUITE 9: Bihar Production Rules & Exact Disqualification Reason Verification
  // -------------------------------------------------------------------------
  console.log("\n🔷 Suite 9: Bihar Dataset Rules & Exact Disqualification Reasons");
  {
    const fs = require("fs");
    const path = require("path");
    const biharDataPath = path.resolve(__dirname, "../../../data/bihar/all_bihar_schemes.json");
    const biharSchemesRaw = JSON.parse(fs.readFileSync(biharDataPath, "utf8"));

    const biharSchemes = biharSchemesRaw.map((s: any) => ({
      ...s,
      _id: new mongoose.Types.ObjectId(),
    }));

    const biharRules = biharSchemes.map((s: any) => ({
      _id: new mongoose.Types.ObjectId(),
      schemeId: s._id,
      ...s.rule,
    }));

    // 9.1 Bihar General Female Graduate -> BPSC Female exemption passes category & awaits Prelims verification
    setupMockData(
      { age: 24, gender: "Female", state: "Bihar", annualIncome: 150000, occupation: "Job Seeker", education: "Graduate", category: "General" },
      biharSchemes,
      biharRules
    );
    let results = await checkEligibility(dummyUserId);

    const bpscWoman = results.find(r => r.schemeName === "BPSC Civil Seva Protsahan Yojana");
    assert(
      bpscWoman?.status === "unverified" && Boolean(bpscWoman.reasons.some(r => r.includes("Preliminary Examination"))),
      "Bihar General Female Graduate passes BPSC category exemption and awaits Prelims verification"
    );

    const kanyaGrad = results.find(r => r.schemeName === "Mukhyamantri Kanya Utthan Yojana - Graduation");
    assert(kanyaGrad?.status === "eligible" && kanyaGrad.eligible === true, "Bihar Female Graduate qualifies for Kanya Utthan Graduation");

    const mahilaUdyami = results.find(r => r.schemeName === "Mukhyamantri Mahila Udyami Yojana");
    assert(mahilaUdyami?.status === "eligible" && mahilaUdyami.eligible === true, "Bihar Female Graduate qualifies for Mahila Udyami Yojana");

    const yuvaUdyamiWoman = results.find(r => r.schemeName === "Mukhyamantri Yuva Udyami Yojana");
    assert(
      yuvaUdyamiWoman?.status === "ineligible" &&
        Boolean(yuvaUdyamiWoman.reasons.some(r => r.includes("Gender criteria not met") && r.includes("(your profile: Female)"))),
      "Female applicant is ineligible for Yuva Udyami with exact gender mismatch reason"
    );

    // 9.2 Bihar General Male Graduate -> BPSC strictly ineligible with exact gender & category reason
    setupMockData(
      { age: 24, gender: "Male", state: "Bihar", annualIncome: 150000, occupation: "Unemployed", education: "Graduate", category: "General" },
      biharSchemes,
      biharRules
    );
    results = await checkEligibility(dummyUserId);

    const bpscMan = results.find(r => r.schemeName === "BPSC Civil Seva Protsahan Yojana");
    assert(
      bpscMan?.status === "ineligible" &&
        Boolean(bpscMan.reasons.some(r => r.includes("Social category criteria not met") && r.includes("(your profile: Male, General)"))),
      "Bihar General Male Graduate is ineligible for BPSC Protsahan citing Male, General"
    );

    const mnssbyMan = results.find(r => r.schemeName === "Mukhyamantri Nischay Swayam Sahayata Bhatta Yojana (MNSSBY)");
    assert(mnssbyMan?.status === "eligible" && mnssbyMan.eligible === true, "Bihar Unemployed Graduate aged 24 qualifies for MNSSBY");

    const pmsUnemployed = results.find(r => r.schemeName === "Bihar Post-Matric Scholarship Scheme (PMS Bihar)");
    assert(
      pmsUnemployed?.status === "ineligible" &&
        Boolean(pmsUnemployed.reasons.some(r => r.includes("Occupation criteria not met") && r.includes("(your profile: Unemployed)"))) &&
        Boolean(pmsUnemployed.reasons.some(r => r.includes("Social category criteria not met") && r.includes("(your profile: General)"))),
      "Unemployed General applicant gets ALL exact disqualification reasons (occupation + category) for PMS Bihar"
    );

    const divyang = results.find(r => r.schemeName === "Bihar Divyangjan Pension Yojana");
    assert(
      divyang?.status === "ineligible" &&
        Boolean(divyang.reasons.some(r => r.includes("exceeds the upper ceiling of ₹60,000"))),
      "Applicant over ₹60,000 income is strictly ineligible for Divyangjan Pension with income ceiling reason"
    );

    const kypGrad = results.find(r => r.schemeName === "Kushal Yuva Program (KYP)");
    assert(kypGrad?.status === "eligible" && kypGrad.eligible === true, "Bihar Graduate aged 24 qualifies for KYP (minimum 10th Pass satisfied)");

    // 9.3 Bihar 14yo School Student (Class 9) & Legacy B.Tech equivalence check
    setupMockData(
      { age: 14, gender: "Female", state: "Bihar", annualIncome: 100000, occupation: "Student", education: "Primary (up to Class 5)", category: "EBC" },
      biharSchemes,
      biharRules
    );
    results = await checkEligibility(dummyUserId);
    const cycleStudent = results.find(r => r.schemeName === "Mukhyamantri Cycle Yojana");
    assert(cycleStudent?.status === "eligible" && cycleStudent.eligible === true, "14yo Bihar school student qualifies for Mukhyamantri Cycle Yojana");

    const pravasiStudent = results.find(r => r.schemeName === "Bihar Pravasi Mazdoor Durghatna Anudan Yojana");
    assert(
      pravasiStudent?.status === "ineligible" &&
        Boolean(pravasiStudent.reasons.some(r => r.includes("below the minimum required age of 18"))) &&
        Boolean(pravasiStudent.reasons.some(r => r.includes("(your profile: Student)"))),
      "14yo Student is ineligible for Pravasi Mazdoor citing both age and Student occupation"
    );

    // 9.4 Incomplete profile gender exemption check (General category + missing gender on BPSC)
    setupMockData(
      { age: 24, state: "Bihar", annualIncome: 150000, occupation: "Job Seeker", education: "Graduate", category: "General" },
      biharSchemes,
      biharRules
    );
    results = await checkEligibility(dummyUserId);
    const bpscMissingGender = results.find(r => r.schemeName === "BPSC Civil Seva Protsahan Yojana");
    assert(
      bpscMissingGender?.status === "unverified" && Boolean(bpscMissingGender.missingProfileFields?.includes("gender")),
      "BPSC marks General user with missing gender as unverified (since Female candidates of any category qualify)"
    );

    // 9.5 Legacy B.Tech profile check for BSCCS & Yuva Udyami
    setupMockData(
      { age: 21, gender: "Male", state: "Bihar", annualIncome: 250000, occupation: "Student", education: "B.Tech", category: "General" },
      biharSchemes,
      biharRules
    );
    results = await checkEligibility(dummyUserId);
    const bsccsBtech = results.find(r => r.schemeName === "Bihar Student Credit Card Scheme (BSCCS)");
    assert(bsccsBtech?.status === "eligible" && bsccsBtech.eligible === true, "B.Tech student aged 21 in Bihar qualifies for BSCCS via equivalence mapping");
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n======================================================================");
  console.log(`Verification Complete: ${passedTests}/${totalTests} tests passed (${failedTests} failures)`);
  console.log("======================================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error("Unhandled error during verification:", err);
  process.exit(1);
});
