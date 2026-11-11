import Scheme, { IScheme } from "../models/Scheme";
import EligibilityRule from "../models/EligibilityRule";

export const BIHAR_ONLY_SCHEME_FILTER: Record<string, any> = {
  $or: [
    {
      level: "central",
      $or: [
        { applicableStates: { $exists: false } },
        { applicableStates: { $size: 0 } },
        { applicableStates: { $in: [/^all$/i, /^bihar$/i] } },
      ],
    },
    { level: "state", state: /^bihar$/i },
  ],
};

export class SchemeService {
  static async createScheme(schemeData: Partial<IScheme>): Promise<IScheme> {
    const newScheme = new Scheme(schemeData);
    const savedScheme = await newScheme.save();
    return savedScheme;
  }

  static async getAllSchemes(): Promise<IScheme[]> {
    const schemes = await Scheme.find(BIHAR_ONLY_SCHEME_FILTER).sort({ createdAt: -1 });
    return schemes;
  }

  static async getSchemeById(schemeId: string): Promise<IScheme | null> {
    const scheme = await Scheme.findById(schemeId);
    return scheme;
  }

  static async updateScheme(
    schemeId: string,
    updateData: Partial<IScheme>
  ): Promise<IScheme | null> {
    const updated = await Scheme.findByIdAndUpdate(
      schemeId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    return updated;
  }

  static async deleteScheme(schemeId: string): Promise<IScheme | null> {
    const deleted = await Scheme.findByIdAndDelete(schemeId);
    if (deleted) {
      // Cascade delete eligibility rule for this scheme
      await EligibilityRule.deleteOne({ schemeId: deleted._id });
    }
    return deleted;
  }
}

export default SchemeService;
