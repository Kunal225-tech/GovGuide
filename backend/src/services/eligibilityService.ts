import mongoose from "mongoose";
import User from "../models/User";
import Scheme from "../models/Scheme";
import EligibilityRule, { IEligibilityRule } from "../models/EligibilityRule";

export type EligibilityStatus = "eligible" | "ineligible" | "unverified";

export interface EligibilityResult {
  schemeId: mongoose.Types.ObjectId;
  schemeName: string;
  status: EligibilityStatus;
  /**
   * Compatibility boolean: true ONLY when status === "eligible".
   * Never true for "ineligible" or "unverified".
   */
  eligible: boolean;
  reasons: string[];
  missingProfileFields?: string[];
}

function matchesCaseInsensitive(
  ruleList: string[] | undefined,
  profileValue: string | undefined
): boolean {
  if (!ruleList || ruleList.length === 0) {
    return true; // No restriction specified in rule
  }
  if (!profileValue || typeof profileValue !== "string" || !profileValue.trim()) {
    return false; // Restriction exists but user has not provided the profile field
  }
  const normalizedVal = profileValue.trim().toLowerCase();
  return ruleList.some((item) => item.trim().toLowerCase() === normalizedVal);
}

export const checkEligibility = async (
  userId: string
): Promise<EligibilityResult[]> => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  // 1. Get user profile
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // 2. Fetch all schemes and all eligibility rules in parallel
  const [schemes, allRules] = await Promise.all([
    Scheme.find().sort({ name: 1 }),
    EligibilityRule.find(),
  ]);

  // Index rules by schemeId for O(1) lookups
  const rulesBySchemeId = new Map<string, IEligibilityRule>();
  for (const rule of allRules) {
    rulesBySchemeId.set(rule.schemeId.toString(), rule);
  }

  const results: EligibilityResult[] = [];
  const profile = user.profile || ({} as any);

  // 3. Evaluate each scheme against its rule
  for (const scheme of schemes) {
    // 3a. Discontinued scheme check
    if (scheme.status === "discontinued") {
      results.push({
        schemeId: scheme._id as mongoose.Types.ObjectId,
        schemeName: scheme.name,
        status: "ineligible",
        eligible: false,
        reasons: ["This scheme has been discontinued by the department."],
      });
      continue;
    }

    const rule = rulesBySchemeId.get(scheme._id.toString());

    // 3b. Missing rule safety gate: NEVER mark as eligible if no rule exists
    if (!rule) {
      results.push({
        schemeId: scheme._id as mongoose.Types.ObjectId,
        schemeName: scheme.name,
        status: "unverified",
        eligible: false,
        reasons: [
          "Eligibility criteria for this scheme has not been verified for automated evaluation. Please consult the official scheme guidelines.",
        ],
      });
      continue;
    }

    // 3c. Incomplete or unverified scheme/rule check
    if (scheme.hasDeterministicRule === false || rule.isVerified === false) {
      results.push({
        schemeId: scheme._id as mongoose.Types.ObjectId,
        schemeName: scheme.name,
        status: "unverified",
        eligible: false,
        reasons: [
          "Eligibility rules for this scheme are incomplete or pending official verification. Please review official guidelines directly.",
        ],
      });
      continue;
    }

    // 3d. Check if rule has at least one configured demographic criterion
    const hasAnyCriteria =
      rule.minAge !== undefined ||
      rule.maxAge !== undefined ||
      rule.maxAnnualIncome !== undefined ||
      (rule.states && rule.states.length > 0) ||
      (rule.occupations && rule.occupations.length > 0) ||
      (rule.educationLevels && rule.educationLevels.length > 0) ||
      (rule.categories && rule.categories.length > 0) ||
      (rule.genders && rule.genders.length > 0) ||
      (scheme.level === "state" && Boolean(scheme.state)) ||
      (scheme.applicableStates && scheme.applicableStates.length > 0);

    if (!hasAnyCriteria) {
      results.push({
        schemeId: scheme._id as mongoose.Types.ObjectId,
        schemeName: scheme.name,
        status: "unverified",
        eligible: false,
        reasons: [
          "No specific demographic criteria have been established for automated checking. Please verify requirements on the official portal.",
        ],
      });
      continue;
    }

    const disqualificationReasons: string[] = [];
    const missingProfileReasons: string[] = [];
    const missingProfileFields: string[] = [];

    // Gender check
    if (rule.genders && rule.genders.length > 0) {
      const restrictedGenders = rule.genders.filter(
        (g) => g.trim().toLowerCase() !== "all"
      );
      if (restrictedGenders.length > 0) {
        if (!profile.gender || typeof profile.gender !== "string" || !profile.gender.trim()) {
          missingProfileFields.push("gender");
          missingProfileReasons.push(
            `Scheme requires gender verification (${restrictedGenders.join(", ")}), but gender is not specified in your profile`
          );
        } else if (!matchesCaseInsensitive(restrictedGenders, profile.gender)) {
          disqualificationReasons.push(
            `Gender criteria not met. Scheme is designated for: ${restrictedGenders.join(", ")} (your profile: ${profile.gender})`
          );
        }
      }
    }

    // Minimum Age check
    if (rule.minAge !== undefined && rule.minAge !== null) {
      if (profile.age === undefined || profile.age === null) {
        if (!missingProfileFields.includes("age")) {
          missingProfileFields.push("age");
          missingProfileReasons.push(
            `Scheme requires a minimum age of ${rule.minAge} (not provided in profile)`
          );
        }
      } else if (profile.age < rule.minAge) {
        disqualificationReasons.push(
          `Your age (${profile.age}) is below the minimum required age of ${rule.minAge}`
        );
      }
    }

    // Maximum Age check
    if (rule.maxAge !== undefined && rule.maxAge !== null) {
      if (profile.age === undefined || profile.age === null) {
        if (!missingProfileFields.includes("age")) {
          missingProfileFields.push("age");
          missingProfileReasons.push(
            `Scheme specifies a maximum age of ${rule.maxAge} (not provided in profile)`
          );
        }
      } else if (profile.age > rule.maxAge) {
        disqualificationReasons.push(
          `Your age (${profile.age}) exceeds the maximum eligible age of ${rule.maxAge}`
        );
      }
    }

    // Annual Income check
    if (rule.maxAnnualIncome !== undefined && rule.maxAnnualIncome !== null) {
      if (profile.annualIncome === undefined || profile.annualIncome === null) {
        missingProfileFields.push("annualIncome");
        missingProfileReasons.push(
          `Annual income must not exceed ₹${rule.maxAnnualIncome.toLocaleString("en-IN")} (income not specified in profile)`
        );
      } else if (profile.annualIncome > rule.maxAnnualIncome) {
        disqualificationReasons.push(
          `Annual income (₹${profile.annualIncome.toLocaleString("en-IN")}) exceeds the upper ceiling of ₹${rule.maxAnnualIncome.toLocaleString("en-IN")}`
        );
      }
    }

    // State / UT check
    let stateRequirements: string[] = [];
    if (rule.states && rule.states.length > 0) {
      stateRequirements = rule.states.filter((s) => s.trim().toLowerCase() !== "all");
    } else if (scheme.applicableStates && scheme.applicableStates.length > 0) {
      stateRequirements = scheme.applicableStates.filter((s) => s.trim().toLowerCase() !== "all");
    } else if (scheme.level === "state" && scheme.state) {
      stateRequirements = [scheme.state];
    }

    if (stateRequirements.length > 0) {
      if (!profile.state || typeof profile.state !== "string" || !profile.state.trim()) {
        missingProfileFields.push("state");
        missingProfileReasons.push(
          `State residency required (${stateRequirements.join(", ")}), but state is not set in profile`
        );
      } else if (!matchesCaseInsensitive(stateRequirements, profile.state)) {
        disqualificationReasons.push(
          `Scheme is restricted to residents of: ${stateRequirements.join(", ")} (your state: ${profile.state})`
        );
      }
    }

    // Occupation check
    if (rule.occupations && rule.occupations.length > 0) {
      if (!profile.occupation || typeof profile.occupation !== "string" || !profile.occupation.trim()) {
        missingProfileFields.push("occupation");
        missingProfileReasons.push(
          `Occupation requirement not satisfied (not specified in profile)`
        );
      } else if (!matchesCaseInsensitive(rule.occupations, profile.occupation)) {
        disqualificationReasons.push(
          `Occupation criteria not met. Scheme covers: ${rule.occupations.join(", ")}`
        );
      }
    }

    // Education check
    if (rule.educationLevels && rule.educationLevels.length > 0) {
      if (!profile.education || typeof profile.education !== "string" || !profile.education.trim()) {
        missingProfileFields.push("education");
        missingProfileReasons.push(
          `Education requirement not satisfied (not specified in profile)`
        );
      } else if (!matchesCaseInsensitive(rule.educationLevels, profile.education)) {
        disqualificationReasons.push(
          `Education criteria not met. Scheme requires: ${rule.educationLevels.join(", ")}`
        );
      }
    }

    // Social Category check
    if (rule.categories && rule.categories.length > 0) {
      if (!profile.category || typeof profile.category !== "string" || !profile.category.trim()) {
        missingProfileFields.push("category");
        missingProfileReasons.push(
          `Social category requirement not satisfied (not specified in profile)`
        );
      } else if (!matchesCaseInsensitive(rule.categories, profile.category)) {
        disqualificationReasons.push(
          `Social category criteria not met. Scheme is designated for: ${rule.categories.join(", ")}`
        );
      }
    }

    // Determine final status
    // 1. If at least one known criterion definitively disqualifies the user -> INELIGIBLE
    if (disqualificationReasons.length > 0) {
      results.push({
        schemeId: scheme._id as mongoose.Types.ObjectId,
        schemeName: scheme.name,
        status: "ineligible",
        eligible: false,
        reasons: disqualificationReasons,
      });
      continue;
    }

    // 2. If no disqualification, but some criteria could not be evaluated due to missing profile info -> UNVERIFIED
    if (missingProfileReasons.length > 0) {
      results.push({
        schemeId: scheme._id as mongoose.Types.ObjectId,
        schemeName: scheme.name,
        status: "unverified",
        eligible: false,
        reasons: missingProfileReasons,
        missingProfileFields,
      });
      continue;
    }

    // 3. All evaluated demographic conditions passed!
    // Check if the rule is verified as complete for automated evaluation without unsupported criteria
    const isRuleComplete =
      rule.isComplete === true &&
      !rule.hasUnsupportedCriteria &&
      (!rule.unsupportedCriteria || rule.unsupportedCriteria.length === 0);

    if (!isRuleComplete) {
      // Legacy rule or partially represented rule
      const unsupportedText =
        rule.unsupportedCriteria && rule.unsupportedCriteria.length > 0
          ? `Scheme has additional conditions (${rule.unsupportedCriteria.join(", ")}) that cannot be evaluated automatically.`
          : "Demographic criteria were satisfied, but official scheme guidelines contain additional requirements (such as landholding, specific certificates, or departmental conditions) that cannot be evaluated automatically.";

      results.push({
        schemeId: scheme._id as mongoose.Types.ObjectId,
        schemeName: scheme.name,
        status: "unverified",
        eligible: false,
        reasons: [
          `${unsupportedText} Please review official portal guidelines to confirm full eligibility.`,
        ],
      });
    } else {
      // Complete, verified rule with all criteria satisfied!
      results.push({
        schemeId: scheme._id as mongoose.Types.ObjectId,
        schemeName: scheme.name,
        status: "eligible",
        eligible: true,
        reasons: [
          "All automated eligibility criteria have been verified and satisfied. Final approval is subject to document verification by the issuing government department.",
        ],
      });
    }
  }

  return results;
};

export default checkEligibility;