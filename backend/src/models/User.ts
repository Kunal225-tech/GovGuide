import mongoose, { Schema, Document } from "mongoose";

interface IUserProfile {
  age?: number;
  gender?: string;
  state?: string;
  district?: string;
  annualIncome?: number;
  occupation?: string;
  education?: string;
  category?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  profile: IUserProfile;
}

const userProfileSchema = new Schema<IUserProfile>(
  {
    age: {
      type: Number,
      min: 0,
    },

    gender: {
      type: String,
    },

    state: {
      type: String,
    },

    district: {
      type: String,
    },

    annualIncome: {
      type: Number,
      min: 0,
    },

    occupation: {
      type: String,
    },

    education: {
      type: String,
    },

    category: {
      type: String,
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    profile: {
      type: userProfileSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;