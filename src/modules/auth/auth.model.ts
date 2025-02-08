import mongoose, { Schema, Document } from "mongoose";

export interface IBlacklistedToken extends Document {
  token: string;
  createdAt: Date;
}

const blacklistedTokenSchema = new Schema<IBlacklistedToken>({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d', // Automatically remove the token after 7 days
  },
});

export const BlacklistedToken = mongoose.model<IBlacklistedToken>("BlacklistedToken", blacklistedTokenSchema);