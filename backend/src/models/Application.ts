import mongoose , { Schema , Document} from "mongoose";

export type ApplicationStatusType = "saved" | "in-progress" | "in-progess" | "submitted" | "approved" | "rejected";

export interface IApplication extends Document {
    userId: mongoose.Types.ObjectId;
    schemeId: mongoose.Types.ObjectId;
    status: ApplicationStatusType;
    notes?: string;
    appliedAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const applicationSchema = new Schema<IApplication>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        schemeId: {
            type: Schema.Types.ObjectId,
            ref: "Scheme",
            required: true,
        },
        status: {
            type: String,
            enum: ["saved", "in-progress", "in-progess", "submitted", "approved", "rejected"],
            default: "saved",
        },
        notes: {
            type: String,
            trim: true,
        },
        appliedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }

)
applicationSchema.index({ userId: 1, schemeId: 1 }, { unique: true });
const Application = mongoose.model<IApplication>("Application", applicationSchema);
export default Application;