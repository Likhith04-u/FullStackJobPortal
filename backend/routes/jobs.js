import { Router } from "express";
import mongoose from "mongoose";
import Job from "../models/Job.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.search) {
      const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: rx }, { company: rx }, { location: rx }, { description: rx }];
    }
    if (req.query.type && req.query.type !== "All") filter.type = req.query.type;
    if (req.query.location) filter.location = new RegExp(String(req.query.location).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const jobs = await Job.find(filter).populate("recruiter", "name company").sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid job ID." });
    const job = await Job.findById(req.params.id).populate("recruiter", "name company email");
    if (!job) return res.status(404).json({ message: "Job not found." });
    res.json({ job });
  } catch (err) { next(err); }
});

router.post("/", authenticate, requireRole("recruiter"), async (req, res, next) => {
  try {
    const { title, company, location, description } = req.body;
    if (![title, company, location, description].every(v => typeof v === "string" && v.trim())) {
      return res.status(400).json({ message: "Title, company, location and description are required." });
    }
    const job = await Job.create({
      title: title.trim(), company: company.trim(), location: location.trim(), description: description.trim(),
      type: req.body.type || "Full-time", salary: req.body.salary || "Not specified",
      requirements: req.body.requirements || "", recruiter: req.user.id
    });
    res.status(201).json({ message: "Job posted successfully.", job });
  } catch (err) { next(err); }
});

router.put("/:id", authenticate, requireRole("recruiter"), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid job ID." });
    const job = await Job.findOne({ _id: req.params.id, recruiter: req.user.id });
    if (!job) return res.status(404).json({ message: "Job not found or not owned by you." });
    const allowed = ["title", "company", "location", "type", "salary", "description", "requirements"];
    for (const key of allowed) if (req.body[key] !== undefined) job[key] = req.body[key];
    await job.save();
    res.json({ message: "Job updated successfully.", job });
  } catch (err) { next(err); }
});

router.delete("/:id", authenticate, requireRole("recruiter"), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid job ID." });
    const job = await Job.findOneAndDelete({ _id: req.params.id, recruiter: req.user.id });
    if (!job) return res.status(404).json({ message: "Job not found or not owned by you." });
    res.json({ message: "Job deleted successfully." });
  } catch (err) { next(err); }
});

export default router;
