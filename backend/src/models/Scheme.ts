import mongoose, { Schema, Document } from "mongoose";

export interface IScheme extends Document {
    name: string;
    description: string;
    category: string;
    level: "central" | "state";
    state?: string;
    benefits: string[];
    eligibility: string[];
    requiredDocuments: string[];
    applicationProcess: string[];
    officialUrl: string;
    source: string;
}

const schemeSchema = new Schema<IScheme>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: String,
            required: true,
            trim: true,
        },

        level: {
            type: String,
            enum: ["central", "state"],
            required: true,
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
            required: true,
            trim: true,
        },

        source: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Scheme = mongoose.model<IScheme>("Scheme", schemeSchema);

export default Scheme;