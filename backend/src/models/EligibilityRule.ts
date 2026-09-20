import mongoose, { Schema, Document } from "mongoose";

export interface IEligibilityRule extends Document {
    schemeId: mongoose.Types.ObjectId;

    minAge?: number;
    maxAge?: number;

    maxAnnualIncome?: number;

    states?: string[];

    occupations?: string[];

    educationLevels?: string[];

    categories?: string[];
}

const eligibilityRuleSchema = new Schema<IEligibilityRule>(
    {
        schemeId: {
            type: Schema.Types.ObjectId,
            ref: "Scheme",
            required: true,
            unique: true,
        },

        minAge: {
            type: Number,
            min: 0,
        },

        maxAge: {
            type: Number,
            min: 0,
        },

        maxAnnualIncome: {
            type: Number,
            min: 0,
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
    },
    {
        timestamps: true,
    }
);

const EligibilityRule = mongoose.model<IEligibilityRule>(
    "EligibilityRule",
    eligibilityRuleSchema
);

export default EligibilityRule;