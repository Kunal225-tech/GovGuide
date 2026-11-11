// user.ts -- TypeScript interfaces for the User and UserProfile entities.
// These mirror the backend Mongoose schemas in backend/src/models/User.ts.

// The profile sub-document (optional fields -- user fills these over time)
export interface UserProfile {
  age?: number;
  gender?: string;
  state?: string;
  district?: string;
  annualIncome?: number;
  occupation?: string;
  education?: string;
  category?: string;
}

// The full user object returned by the profile API (password excluded by backend)
export interface User {
  _id: string;
  name: string;
  email: string;
  role?: "user" | "admin";
  profile: UserProfile;
  createdAt?: string;
  updatedAt?: string;
}

// Shape of GET /api/profile response
export interface GetProfileResponse {
  message: string;
  user: User;
}

// Shape of PUT /api/profile response
export interface UpdateProfileResponse {
  message: string;
  user: User;
}

// Shape of the data we send in PUT /api/profile body
export interface UpdateProfilePayload {
  age?: number;
  gender?: string;
  state?: string;
  district?: string;
  annualIncome?: number;
  occupation?: string;
  education?: string;
  category?: string;
}

// Controlled string form state used by ProfilePage & AiProfileAutoFillPanel
export interface ProfileFormFields {
  age: string;
  gender: string;
  state: string;
  district: string;
  annualIncome: string;
  occupation: string;
  education: string;
  category: string;
}
