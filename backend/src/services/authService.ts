import User from "../models/User";
import bcrypt from 'bcryptjs';
import generateToken from "../utils/generateToken";

interface RegisterData {
    name: string;
    email: string;
    password: string;
}

interface LoginData {
    email: string;
    password: string;
}

const registerUser = async ( {
    name,
    email,
    password
}: RegisterData) => {
    const existingUSer = await User.findOne({ email});
    if (existingUSer) {
        throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await  User.create({
        name,
        email,
        password: hashedPassword,
    });
    return newUser;

}

export const loginUser = async ({
  email,
  password,
}: LoginData) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordCorrect) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user._id.toString());

  return {
    user,
    token,
  };
};

export default registerUser;
