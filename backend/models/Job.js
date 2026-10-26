import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  type: { type: String, enum: ["Full-time", "Part-time", "Internship", "Contract"], default: "Full-time" },
  salary: { type: String, default: "Not specified" },
  description: { type: String, required: true },
  requirements: { type: String, default: "" },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("Job", jobSchema);
