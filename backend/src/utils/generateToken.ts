import jwt from "jsonwebtoken";

const generateToken = (userId: string) => {
  return jwt.sign(
    { userId },
    "govguide-secret-key",
    { expiresIn: "7d" }
  );
};

export default generateToken;