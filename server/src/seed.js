/**
 * seed.js — Populates MongoDB Atlas with default ERP data.
 * Run with:  npm run seed  (from the server/ directory)
 *
 * Creates:
 *   - 3 users: admin, teacher, student (with null passwordHash — uses DEV fallback in login)
 *   - 2 courses: CS301, CS302
 *   - 1 section: CS301 taught by the teacher, term 2025-Fall
 *   - 1 enrollment: student enrolled in that section
 *   - 1 fee: ₹25,000 DUE for the student
 */

import "dotenv/config.js";
import mongoose from "mongoose";
import { connectMongo } from "./db/mongo.js";

import { User }       from "./models/user.model.js";
import { Course }     from "./models/course.model.js";
import { Section }    from "./models/section.model.js";
import { Enrollment } from "./models/enrollment.model.js";
import { Fee }        from "./models/fee.model.js";

async function seed() {
  await connectMongo(process.env.MONGO_URL);
  console.log("🌱 Starting seed...");

  // ── Users ────────────────────────────────────────────────────────────────
  // Upsert by email so re-running seed is safe
  const admin = await User.findOneAndUpdate(
    { email: "admin@erp.test" },
    { fullName: "System Admin", role: "ADMIN", passwordHash: null },
    { upsert: true, new: true }
  );
  const teacher = await User.findOneAndUpdate(
    { email: "teacher@erp.test" },
    { fullName: "Dr. Meera Iyer", role: "TEACHER", passwordHash: null },
    { upsert: true, new: true }
  );
  const student = await User.findOneAndUpdate(
    { email: "student@erp.test" },
    { fullName: "Arjun Patel", role: "STUDENT", passwordHash: null },
    { upsert: true, returnDocument: "after" }
  );
  console.log("  ✅ Users seeded");

  // ── Courses ──────────────────────────────────────────────────────────────
  const cs301 = await Course.findOneAndUpdate(
    { code: "CS301" },
    { title: "Data Structures", credits: 4 },
    { upsert: true, returnDocument: "after" }
  );
  await Course.findOneAndUpdate(
    { code: "CS302" },
    { title: "Operating Systems", credits: 4 },
    { upsert: true, returnDocument: "after" }
  );
  console.log("  ✅ Courses seeded");

  // ── Section ──────────────────────────────────────────────────────────────
  const section = await Section.findOneAndUpdate(
    { courseId: cs301._id, teacherId: teacher._id, term: "2025-Fall" },
    { courseId: cs301._id, teacherId: teacher._id, term: "2025-Fall" },
    { upsert: true, returnDocument: "after" }
  );
  console.log("  ✅ Section seeded");

  // ── Enrollment ───────────────────────────────────────────────────────────
  await Enrollment.findOneAndUpdate(
    { studentId: student._id, sectionId: section._id },
    { studentId: student._id, sectionId: section._id },
    { upsert: true, returnDocument: "after" }
  );
  console.log("  ✅ Enrollment seeded");

  // ── Fee ──────────────────────────────────────────────────────────────────
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  await Fee.findOneAndUpdate(
    { studentId: student._id, term: "2025-Fall" },
    { studentId: student._id, term: "2025-Fall", amount: 25000, status: "DUE", dueDate },
    { upsert: true, returnDocument: "after" }
  );
  console.log("  ✅ Fee seeded");

  console.log("\n🎉 Seed complete! Default credentials:");
  console.log("   Admin:   admin@erp.test   / admin123");
  console.log("   Teacher: teacher@erp.test / teacher123");
  console.log("   Student: student@erp.test / student123");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
