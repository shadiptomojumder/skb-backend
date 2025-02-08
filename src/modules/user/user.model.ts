import mongoose, { Schema } from "mongoose";
import { userSchema } from "./user.schemas";

const userSchemaDefinition = new Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true, // Helps avoid creating a blank index
    },
    address: {
      type: String,
      lowercase: true,
      sparse: true, // Helps avoid creating a blank index
    },
    googleId: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true, // Helps avoid creating a blank index
    },
    role: {
      type: String,
      default: "USER",
    },
    avatar: {
      type: String,
    },
    otp: {
      type: Number,
    },
    password: {
      type: String,
      required: true,
      select: false, // Exclude from query results
    },
    refreshToken: {
      type: String,
      select: false, // Exclude from query results
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook for Zod validation
userSchemaDefinition.pre("save", async function (next) {
  const { error } = userSchema.safeParse(this.toObject());
  if (error) {
    const errorMessages = error.errors.map((err) => err.message).join(", ");
    next(new Error(`Validation failed: ${errorMessages}`));
  }
});

export const User = mongoose.model("User", userSchemaDefinition);
