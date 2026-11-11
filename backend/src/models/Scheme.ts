import mongoose, { Schema, Document } from "mongoose";

export const VALID_CATEGORIES = [
  "Agriculture",
  "Employment",
  "Housing",
  "Healthcare",
  "Education",
  "Women & Child",
  "Financial Assistance",
  "Social Welfare",
  "Entrepreneurship",
] as const;

export type SchemeCategory = (typeof VALID_CATEGORIES)[number];

export const VALID_SCHEME_TYPES = [
  "central-sector",
  "centrally-sponsored",
  "state",
  "ut",
] as const;

export type SchemeType = (typeof VALID_SCHEME_TYPES)[number];

export const VALID_VERIFICATION_STATUSES = [
  "verified",
  "unverified",
  "needs-review",
  "disputed",
] as const;

export type VerificationStatus = (typeof VALID_VERIFICATION_STATUSES)[number];

export const VALID_SCHEME_STATUSES = [
  "active",
  "discontinued",
  "under-review",
] as const;

export type SchemeStatus = (typeof VALID_SCHEME_STATUSES)[number];

export interface IScheme extends Document {
  name: string;
  description: string;
  category: SchemeCategory;
  level: "central" | "state";
  state?: string;
  benefits: string[];
  eligibility: string[];
  requiredDocuments: string[];
  applicationProcess: string[];
  officialUrl: string;
  source: string;

  // Phase 1 Additive Fields (Optional & Backward Compatible)
  schemeType?: SchemeType;
  applicableStates?: string[];
  sourcePlatform?: string;
  sourceId?: string;
  verificationStatus?: VerificationStatus;
  verifiedAt?: Date;
  applicationUrl?: string;
  status?: SchemeStatus;
  hasDeterministicRule?: boolean;

  // Phase B Provenance & Audit Fields (Optional & Backward Compatible)
  aliases?: string[];
  exclusions?: string[];
  officialDocUrl?: string;
  sourceDocumentTitle?: string;
  verifiedBy?: string;
  unresolvedQuestions?: string[];
}

const schemeSchema = new Schema<IScheme>(
  {
    name: {
      type: String,
      required: [true, "Scheme name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Scheme name must be at least 3 characters"],
      maxlength: [200, "Scheme name must not exceed 200 characters"],
    },

    description: {
      type: String,
      required: [true, "Scheme description is required"],
      trim: true,
      minlength: [10, "Scheme description must be at least 10 characters"],
    },

    category: {
      type: String,
      required: [true, "Scheme category is required"],
      trim: true,
      enum: {
        values: VALID_CATEGORIES,
        message: "{VALUE} is not a supported scheme category",
      },
    },

    level: {
      type: String,
      enum: {
        values: ["central", "state"],
        message: "Scheme level must be either 'central' or 'state'",
      },
      required: [true, "Scheme level is required"],
    },

    state: {
      type: String,
      trim: true,
    },

    benefits: {
      type: [String],
      default: [],
    },

    eligibility: {
      type: [String],
      default: [],
    },

    requiredDocuments: {
      type: [String],
      default: [],
    },

    applicationProcess: {
      type: [String],
      default: [],
    },

    officialUrl: {
      type: String,
      required: [true, "Official scheme portal URL is required"],
      trim: true,
      validate: {
        validator: (val: string) => /^https?:\/\/.+/i.test(val),
        message: "officialUrl must be a valid HTTP or HTTPS URL",
      },
    },

    source: {
      type: String,
      required: [true, "Official government ministry or department source is required"],
      trim: true,
    },

    // Phase 1 Additive Schema Fields (Optional & Backward Compatible)
    schemeType: {
      type: String,
      enum: {
        values: VALID_SCHEME_TYPES,
        message: "{VALUE} is not a supported scheme type",
      },
    },

    applicableStates: {
      type: [String],
      default: [],
    },

    sourcePlatform: {
      type: String,
      trim: true,
    },

    sourceId: {
      type: String,
      trim: true,
    },

    verificationStatus: {
      type: String,
      enum: {
        values: VALID_VERIFICATION_STATUSES,
        message: "{VALUE} is not a supported verification status",
      },
      default: "unverified",
    },

    verifiedAt: {
      type: Date,
    },

    applicationUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (val: string) => !val || /^https?:\/\/.+/i.test(val),
        message: "applicationUrl must be a valid HTTP or HTTPS URL",
      },
    },

    status: {
      type: String,
      enum: {
        values: VALID_SCHEME_STATUSES,
        message: "{VALUE} is not a supported scheme status",
      },
      default: "active",
    },

    hasDeterministicRule: {
      type: Boolean,
    },

    // Phase B Provenance & Audit Fields
    aliases: {
      type: [String],
      default: [],
    },

    exclusions: {
      type: [String],
      default: [],
    },

    officialDocUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (val: string) => !val || /^https?:\/\/.+/i.test(val),
        message: "officialDocUrl must be a valid HTTP or HTTPS URL",
      },
    },

    sourceDocumentTitle: {
      type: String,
      trim: true,
    },

    verifiedBy: {
      type: String,
      trim: true,
    },

    unresolvedQuestions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Mandatory state check for state-level schemes & auto-sync applicableStates
schemeSchema.pre("validate", function (this: any, next?: any) {
  if (
    this.level === "state" &&
    (!this.state || typeof this.state !== "string" || this.state.trim().length === 0)
  ) {
    this.invalidate("state", "State name is mandatory for state-level schemes");
  }

  // Populate applicableStates from state if applicableStates was not explicitly provided
  if (
    (!this.applicableStates || this.applicableStates.length === 0) &&
    this.state &&
    typeof this.state === "string" &&
    this.state.trim().length > 0
  ) {
    this.applicableStates = [this.state.trim()];
  }

  if (typeof next === "function") {
    next();
  }
});

schemeSchema.index({ category: 1, level: 1, state: 1 });

const Scheme = mongoose.model<IScheme>("Scheme", schemeSchema);

export default Scheme;