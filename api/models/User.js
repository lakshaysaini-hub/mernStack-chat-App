import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      unique: true,
    },
  },
  { timestams: true }
);

export const User = mongoose.model("User", userSchema);
