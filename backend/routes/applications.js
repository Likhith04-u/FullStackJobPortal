import { Router } from "express";
import mongoose from "mongoose";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.post("/", requireRole("student"), async (req, res, next) => {
  try {
    const { jobId, coverLetter = "" } = req.body;
    if (!mongoose.isValidObjectId(jobId)) return res.status(400).json({ message: "Valid job ID is required." });
    if (!(await Job.exists({ _id: jobId }))) return res.status(404).json({ message: "Job not found." });
    const existing = await Application.findOne({ job: jobId, student: req.user.id });
    if (existing) return res.status(409).json({ message: "You have already applied for this job." });
    const application = await Application.create({ job: jobId, student: req.user.id, coverLetter });
    res.status(201).json({ message: "Application submitted.", application });
  } catch (err) { next(err); }
});

router.get("/mine", requireRole("student"), async (req, res, next) => {
  try {
    const applications = await Application.find({ student: req.user.id })
      .populate("job").sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) { next(err); }
});

router.get("/received", requireRole("recruiter"), async (req, res, next) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.id }).select("_id");
    const applications = await Application.find({ job: { $in: jobs.map(j => j._id) } })
      .populate("job").populate("student", "name email phone location skills education experience")
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) { next(err); }
});

router.patch("/:id/status", requireRole("recruiter"), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid application ID." });
    const allowed = ["Applied", "Under Review", "Shortlisted", "Rejected", "Hired"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid status." });
    const application = await Application.findById(req.params.id).populate("job");
    if (!application || application.job.recruiter.toString() !== req.user.id) {
      return res.status(404).json({ message: "Application not found." });
    }
    application.status = req.body.status;
    await application.save();
    res.json({ message: "Application status updated.", application });
  } catch (err) { next(err); }
});

export default router;
