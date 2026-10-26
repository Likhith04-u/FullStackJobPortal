import { Router } from "express";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Profile not found." });
    const { passwordHash, ...profile } = user.toObject();
    res.json({ profile: { ...profile, id: profile._id } });
  } catch (err) { next(err); }
});

router.put("/", async (req, res, next) => {
  try {
    const allowed = ["name", "phone", "location", "skills", "education", "experience", "company", "bio"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    if (typeof updates.skills === "string") updates.skills = updates.skills.split(",").map(s => s.trim()).filter(Boolean);
    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: "Profile not found." });
    const { passwordHash, ...profile } = user.toObject();
    res.json({ message: "Profile updated.", profile: { ...profile, id: profile._id } });
  } catch (err) { next(err); }
});

export default router;
