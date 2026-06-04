import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const router = express.Router();

const isProd = process.env.NODE_ENV === "production";

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const email    = (req.body.email    || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    // Dev fallback passwords for seeded users (when passwordHash is null)
    const DEV = {
      "admin@erp.test":   "admin123",
      "teacher@erp.test": "teacher123",
      "student@erp.test": "student123",
    };

    let ok = false;
    if (user.passwordHash) {
      ok = await bcrypt.compare(password, user.passwordHash);
    } else if (DEV[email] && password === DEV[email]) {
      ok = true;
    }

    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "7d" }
    );

    // sameSite "none" + secure true required for cross-domain cookies
    // (Vercel frontend <-> Render backend run on different origins in production)
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure:   isProd,
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      id:    String(user._id),
      name:  user.fullName,
      email: user.email,
      role:  user.role,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  // clearCookie must mirror the same sameSite/secure flags used when setting
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure:   isProd,
  });
  res.json({ ok: true });
});

export default router;
