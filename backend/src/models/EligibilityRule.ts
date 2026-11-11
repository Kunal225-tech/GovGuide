import mongoose, { Schema, Document } from "mongoose";

export const VALID_GENDERS = ["Male", "Female", "Transgender", "Other", "All"] as const;
export type GenderType = (typeof VALID_GENDERS)[number];

export interface IEligibilityRule extends Document {
  schemeId: mongoose.Types.ObjectId;
  minAge?: number;
  maxAge?: number;
  maxAnnualIncome?: number;
  states?: string[];
  occupations?: string[];
  educationLevels?: string[];
  categories?: string[];
  genders?: string[];
  isVerified?: boolean;
  isComplete?: boolean;
  hasUnsupportedCriteria?: boolean;
  unsupportedCriteria?: string[];
}

const eligibilityRuleSchema = new Schema<IEligibilityRule>(
  {
    schemeId: {
      type: Schema.Types.ObjectId,
      ref: "Scheme",
      required: [true, "schemeId is required for an eligibility rule"],
      unique: true,
    },

    minAge: {
      type: Number,
      min: [0, "minAge cannot be negative"],
      max: [120, "minAge exceeds realistic lifespan limit"],
    },

    maxAge: {
      type: Number,
      min: [0, "maxAge cannot be negative"],
      max: [120, "maxAge exceeds realistic lifespan limit"],
    },

    maxAnnualIncome: {
      type: Number,
      min: [0, "maxAnnualIncome cannot be negative"],
    },

    states: {
      type: [String],
      default: [],
    },

    occupations: {
      type: [String],
      default: [],
    },

    educationLevels: {
      type: [String],
      default: [],
    },

    categories: {
      type: [String],
      default: [],
    },

    genders: {
      type: [String],
      default: [],
      validate: {
        validator: function (val: string[]) {
          if (!val || val.length === 0) return true;
          const allowed = ["male", "female", "transgender", "other", "all"];
          return val.every(
            (g) => typeof g === "string" && allowed.includes(g.trim().toLowerCase())
          );
        },
        message:
          "genders contains unsupported values. Supported: Male, Female, Transgender, Other, All",
      },
    },

    isVerified: {
      type: Boolean,
      default: true,
    },

    isComplete: {
      type: Boolean,
      default: false,
    },

    hasUnsupportedCriteria: {
      type: Boolean,
      default: false,
    },

    unsupportedCriteria: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook ensuring minAge does not exceed maxAge
eligibilityRuleSchema.pre("validate", function (this: any, next?: any) {
  if (
    typeof this.minAge === "number" &&
    typeof this.maxAge === "number" &&
    this.minAge > this.maxAge
  ) {
    this.invalidate("minAge", "minAge cannot be greater than maxAge");
  }
  if (typeof next === "function") {
    next();
  }
});

const EligibilityRule = mongoose.model<IEligibilityRule>(
  "EligibilityRule",
  eligibilityRuleSchema
);

export default EligibilityRule;