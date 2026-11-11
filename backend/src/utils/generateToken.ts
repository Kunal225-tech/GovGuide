import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

const generateToken = (userId: string, role: string = "user"): string => {
  return jwt.sign(
    { userId, role },
    ENV.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export default generateToken;