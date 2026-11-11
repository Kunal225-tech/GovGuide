import User from "../models/User";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: "user" | "admin";
}

interface LoginData {
  email: string;
  password: string;
}

export interface SafeUserData {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  profile?: any;
}

export const registerUser = async ({
  name,
  email,
  password,
  role = "user",
}: RegisterData): Promise<SafeUserData> => {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    name: trimmedName,
    email: normalizedEmail,
    password: hashedPassword,
    role,
  });

  return {
    id: newUser._id.toString(),
    _id: newUser._id.toString(),
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    profile: newUser.profile || {},
  };
};

export const loginUser = async ({
  email,
  password,
}: LoginData): Promise<{ user: SafeUserData; token: string }> => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user._id.toString(), user.role);

  return {
    user: {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile || {},
    },
    token,
  };
};

export default registerUser;
