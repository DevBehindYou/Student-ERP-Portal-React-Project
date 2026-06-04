import { Router } from "express";
import bcrypt from "bcryptjs";
import { auth, allow } from "../middleware/auth.js";
import { User }       from "../models/user.model.js";
import { Course }     from "../models/course.model.js";
import { Section }    from "../models/section.model.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Exam }       from "../models/exam.model.js";
import { Result }     from "../models/result.model.js";
import { Fee }        from "../models/fee.model.js";
import { Notice }     from "../models/notice.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(auth, allow("ADMIN"));

// ── Ping ────────────────────────────────────────────────────────────────────
router.get("/ping", (_req, res) => res.json({ ok: true }));

// ── COURSES ─────────────────────────────────────────────────────────────────
router.get("/courses", asyncHandler(async (_req, res) => {
  const courses = await Course.find({}).sort({ code: 1 }).lean();
  res.json(courses);
}));

router.post("/courses", asyncHandler(async (req, res) => {
  const code  = (req.body.code  || "").trim().toUpperCase();
  const title = (req.body.title || "").trim();
  if (!code || !title) return res.status(400).json({ error: "code and title required" });
  const course = await Course.create({ code, title, credits: req.body.credits || 4 });
  res.json(course);
}));

router.put("/courses/:id", asyncHandler(async (req, res) => {
  const code  = (req.body.code  || "").trim().toUpperCase();
  const title = (req.body.title || "").trim();
  if (!code || !title) return res.status(400).json({ error: "code and title required" });
  const updated = await Course.findByIdAndUpdate(
    req.params.id,
    { code, title },
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: "Course not found" });
  res.json(updated);
}));

router.delete("/courses/:id", asyncHandler(async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// ── USERS ────────────────────────────────────────────────────────────────────
router.get("/users", asyncHandler(async (_req, res) => {
  const users = await User.find({}, "-passwordHash").sort({ createdAt: -1 }).lean();
  // Normalize to flat field names the frontend expects
  res.json(users.map(u => ({ id: String(u._id), full_name: u.fullName, email: u.email, role: u.role })));
}));

router.post("/users", asyncHandler(async (req, res) => {
  const fullName = (req.body.full_name || "").trim();
  const email    = (req.body.email     || "").trim().toLowerCase();
  const role     = (req.body.role      || "").toUpperCase();
  const password = String(req.body.password || "");

  if (!fullName) return res.status(400).json({ error: "full_name is required" });
  if (!email)    return res.status(400).json({ error: "email is required" });
  if (!["ADMIN", "TEACHER", "STUDENT"].includes(role))
    return res.status(400).json({ error: "role must be ADMIN / TEACHER / STUDENT" });
  if (password.length < 6)
    return res.status(400).json({ error: "password must be at least 6 chars" });

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ fullName, email, passwordHash, role });
    res.json({ ok: true, id: String(user._id) });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: "Email already exists" });
    throw e;
  }
}));

router.delete("/users/:id", asyncHandler(async (req, res) => {
  if (String(req.user.id) === req.params.id)
    return res.status(400).json({ error: "You cannot delete your own account" });
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// ── TEACHERS & STUDENTS (dropdowns) ─────────────────────────────────────────
router.get("/teachers", asyncHandler(async (_req, res) => {
  const teachers = await User.find({ role: "TEACHER" }, "fullName email").sort({ fullName: 1 }).lean();
  res.json(teachers.map(t => ({ id: String(t._id), full_name: t.fullName, email: t.email })));
}));

router.get("/students", asyncHandler(async (_req, res) => {
  const students = await User.find({ role: "STUDENT" }, "fullName email").sort({ fullName: 1 }).lean();
  res.json(students.map(s => ({ id: String(s._id), full_name: s.fullName, email: s.email })));
}));

// ── SECTIONS ─────────────────────────────────────────────────────────────────
router.get("/sections", asyncHandler(async (_req, res) => {
  const sections = await Section.find({})
    .populate("courseId", "code title")
    .populate("teacherId", "fullName")
    .sort({ createdAt: -1 })
    .lean();
  // Flatten to match frontend's expected field names
  res.json(sections.map(s => ({
    id:           String(s._id),
    course_code:  s.courseId?.code  || "",
    course_title: s.courseId?.title || "",
    teacher_name: s.teacherId?.fullName || "",
    term:         s.term,
    courseId:     String(s.courseId?._id || ""),
    teacherId:    String(s.teacherId?._id || ""),
  })));
}));

router.post("/sections", asyncHandler(async (req, res) => {
  const { courseId, teacherId, term } = req.body;
  if (!courseId)          return res.status(400).json({ error: "courseId is required" });
  if (!teacherId)         return res.status(400).json({ error: "teacherId is required" });
  if (!(term || "").trim()) return res.status(400).json({ error: "term is required" });

  const section = await Section.create({ courseId, teacherId, term: term.trim() });
  res.json({ ok: true, id: String(section._id) });
}));

router.delete("/sections/:id", asyncHandler(async (req, res) => {
  await Section.findByIdAndDelete(req.params.id);
  // Clean up related enrollments, attendance, exams (cascade-like)
  await Enrollment.deleteMany({ sectionId: req.params.id });
  res.json({ ok: true });
}));

// ── ROSTER (enrollment) ───────────────────────────────────────────────────────
router.get("/sections/:id/roster", asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ sectionId: req.params.id })
    .populate("studentId", "fullName email")
    .lean();
  res.json(enrollments
    .filter(e => e.studentId)  // guard against orphaned enrollments
    .map(e => ({
      student_id: String(e.studentId._id),
      full_name:  e.studentId.fullName,
      email:      e.studentId.email,
    }))
  );
}));

router.post("/sections/:id/enroll", asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: "studentId required" });
  try {
    await Enrollment.create({ sectionId: req.params.id, studentId });
  } catch (e) {
    if (e.code === 11000) return res.json({ ok: true }); // already enrolled — idempotent
    throw e;
  }
  res.json({ ok: true });
}));

router.delete("/sections/:id/enroll/:studentId", asyncHandler(async (req, res) => {
  await Enrollment.deleteOne({ sectionId: req.params.id, studentId: req.params.studentId });
  res.json({ ok: true });
}));

// ── EXAMS ─────────────────────────────────────────────────────────────────────
router.get("/sections/:id/exams", asyncHandler(async (req, res) => {
  const exams = await Exam.find({ sectionId: req.params.id }).sort({ examDate: 1 }).lean();
  res.json(exams);
}));

router.post("/sections/:id/exams", asyncHandler(async (req, res) => {
  const name     = (req.body.name || "").trim();
  const maxMarks = Number(req.body.max_marks ?? 100);
  const examDate = req.body.exam_date ? new Date(req.body.exam_date) : new Date();

  if (!name) return res.status(400).json({ error: "Exam name is required" });

  const sectionExists = await Section.findById(req.params.id).lean();
  if (!sectionExists) return res.status(404).json({ error: "Section not found" });

  const exam = await Exam.create({
    sectionId: req.params.id,
    name,
    maxMarks: Number.isFinite(maxMarks) ? maxMarks : 100,
    examDate,
  });
  res.json({ ok: true, id: String(exam._id) });
}));

router.delete("/exams/:examId", asyncHandler(async (req, res) => {
  await Exam.findByIdAndDelete(req.params.examId);
  await Result.deleteMany({ examId: req.params.examId });
  res.json({ ok: true });
}));

// ── RESULTS (upsert) ──────────────────────────────────────────────────────────
router.post("/sections/:id/results", asyncHandler(async (req, res) => {
  const { entries } = req.body || {};
  if (!Array.isArray(entries)) return res.status(400).json({ error: "entries[] required" });

  for (const row of entries) {
    const studentId = row.studentId;
    for (const [examId, val] of Object.entries(row.scores || {})) {
      const marksObtained = (val === "" || val == null) ? null : Number(val);
      await Result.findOneAndUpdate(
        { examId, studentId },
        { $set: { marksObtained } },
        { upsert: true }
      );
    }
  }
  res.json({ ok: true });
}));

// ── NOTICES ───────────────────────────────────────────────────────────────────
router.get("/notices", asyncHandler(async (_req, res) => {
  const list = await Notice.find({}).sort({ createdAt: -1 }).lean();
  res.json(list);
}));

router.post("/notices", asyncHandler(async (req, res) => {
  const title    = (req.body.title    || "").trim();
  const body     = (req.body.body     || "").trim();
  const audience = (req.body.audience || "ALL").toUpperCase();
  if (!title || !body) return res.status(400).json({ error: "Title and body are required" });
  const doc = await Notice.create({
    title,
    body,
    audience: ["ALL", "STUDENT", "TEACHER"].includes(audience) ? audience : "ALL",
    createdBy: req.user.id,
  });
  res.json(doc);
}));

router.delete("/notices/:id", asyncHandler(async (req, res) => {
  const deleted = await Notice.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Notice not found" });
  res.json({ ok: true });
}));

// ── FEES ──────────────────────────────────────────────────────────────────────
router.get("/fees", asyncHandler(async (req, res) => {
  const status = req.query.status || "DUE";
  const fees = await Fee.find({ status })
    .sort({ dueDate: -1 })
    .populate("studentId", "fullName email")
    .lean();
  res.json(fees);
}));

router.post("/fees", asyncHandler(async (req, res) => {
  const studentId = req.body.studentId;
  const term      = (req.body.term || "").trim();
  const amount    = Number(req.body.amount);
  const dueDate   = req.body.due_date ? new Date(req.body.due_date) : null;

  if (!studentId)                        return res.status(400).json({ error: "studentId required" });
  if (!term)                             return res.status(400).json({ error: "term required" });
  if (!Number.isFinite(amount) || amount <= 0)
    return res.status(400).json({ error: "amount must be > 0" });

  await Fee.create({ studentId, term, amount, dueDate });
  res.json({ ok: true });
}));

router.post("/fees/bulk", asyncHandler(async (req, res) => {
  const { sectionId, term, amount, due_date } = req.body;
  if (!sectionId) return res.status(400).json({ error: "sectionId required" });
  if (!term)      return res.status(400).json({ error: "term required" });
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: "amount must be > 0" });

  const enrollments = await Enrollment.find({ sectionId }).lean();
  if (!enrollments.length) return res.json({ ok: true, inserted: 0 });

  const dueDate = due_date ? new Date(due_date) : null;
  const docs = enrollments.map(e => ({
    studentId: e.studentId,
    term,
    amount: amt,
    status: "DUE",
    dueDate,
  }));
  await Fee.insertMany(docs);
  res.json({ ok: true, inserted: docs.length });
}));

router.post("/fees/:id/mark-paid", asyncHandler(async (req, res) => {
  await Fee.findByIdAndUpdate(req.params.id, { status: "PAID" });
  res.json({ ok: true });
}));

export default router;
