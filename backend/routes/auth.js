import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const publicUser = (user) => ({
  id: user._id, name: user.name, email: user.email, role: user.role,
  phone: user.phone, location: user.location, skills: user.skills,
  education: user.education, experience: user.experience, company: user.company, bio: user.bio
});
const makeToken = (user) => jwt.sign(
  { id: user._id.toString(), role: user.role, name: user.name },
  process.env.JWT_SECRET, { expiresIn: "7d" }
);

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !["student", "recruiter"].includes(role)) {
      return res.status(400).json({ message: "Name, email, password and a valid role are required." });
    }
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    const user = await User.create({
      name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12), role,
      company: role === "recruiter" ? (req.body.company || "") : ""
    });
    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) { next(err); }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) { next(err); }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

export default router;
