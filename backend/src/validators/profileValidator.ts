import { Request, Response, NextFunction } from "express";

export const validateProfileUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {
    age,
    gender,
    state,
    district,
    annualIncome,
    occupation,
    education,
    category,
  } = req.body;

  const errors: string[] = [];

  if (age !== undefined && age !== null && age !== "") {
    const numAge = Number(age);
    if (isNaN(numAge) || numAge < 0 || numAge > 120) {
      errors.push("Age must be a valid number between 0 and 120.");
    }
  }

  if (annualIncome !== undefined && annualIncome !== null && annualIncome !== "") {
    const numIncome = Number(annualIncome);
    if (isNaN(numIncome) || numIncome < 0) {
      errors.push("Annual income must be a non-negative number.");
    }
  }

  const stringFields = [
    { name: "gender", val: gender, max: 50 },
    { name: "state", val: state, max: 100 },
    { name: "district", val: district, max: 100 },
    { name: "occupation", val: occupation, max: 100 },
    { name: "education", val: education, max: 100 },
    { name: "category", val: category, max: 100 },
  ];

  for (const field of stringFields) {
    if (field.val !== undefined && field.val !== null && typeof field.val !== "string") {
      errors.push(`${field.name} must be a valid text string.`);
    } else if (typeof field.val === "string" && field.val.length > field.max) {
      errors.push(`${field.name} exceeds maximum length of ${field.max} characters.`);
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
    return;
  }

  next();
};
