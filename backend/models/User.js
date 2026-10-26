import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["student", "recruiter"], required: true },
  phone: { type: String, default: "" },
  location: { type: String, default: "" },
  skills: { type: [String], default: [] },
  education: { type: String, default: "" },
  experience: { type: String, default: "" },
  company: { type: String, default: "" },
  bio: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
