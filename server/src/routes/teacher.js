import { Router } from "express";
import { auth, allow }  from "../middleware/auth.js";
import { Section }      from "../models/section.model.js";
import { Enrollment }   from "../models/enrollment.model.js";
import { Attendance }   from "../models/attendance.model.js";
import { Assignment }   from "../models/assignment.model.js";
import { Submission }   from "../models/submission.model.js";
import { Notice }       from "../models/notice.model.js";

const router = Router();
router.use(auth, allow("TEACHER"));

// ── Sections taught by this teacher ──────────────────────────────────────────
router.get("/sections", async (req, res, next) => {
  try {
    const sections = await Section.find({ teacherId: req.user.id })
      .populate("courseId", "code title")
      .sort({ createdAt: -1 })
      .lean();
    res.json(sections.map(s => ({
      id:           String(s._id),
      course_code:  s.courseId?.code  || "",
      course_title: s.courseId?.title || "",
      term:         s.term,
    })));
  } catch (e) { next(e); }
});

// ── Roster for a section ──────────────────────────────────────────────────────
router.get("/sections/:id/roster", async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ sectionId: req.params.id })
      .populate("studentId", "fullName email")
      .lean();
    res.json(enrollments
      .filter(e => e.studentId)
      .map(e => ({
        student_id: String(e.studentId._id),
        full_name:  e.studentId.fullName,
        email:      e.studentId.email,
      }))
    );
  } catch (e) { next(e); }
});

// ── Attendance ────────────────────────────────────────────────────────────────
// GET existing marks for a day
router.get("/attendance", async (req, res, next) => {
  try {
    const sectionId = req.query.sectionId;
    const attDate   = new Date(req.query.date);
    const rows = await Attendance.find({ sectionId, attDate }).lean();
    res.json(rows.map(r => ({ student_id: String(r.studentId), present: r.present })));
  } catch (e) { next(e); }
});

// Bulk upsert attendance
router.post("/attendance", async (req, res, next) => {
  try {
    const { sectionId, date, entries } = req.body;
    if (!sectionId || !date)
      return res.status(400).json({ error: "sectionId and date are required" });

    const attDate = new Date(date);
    for (const row of (entries || [])) {
      await Attendance.findOneAndUpdate(
        { sectionId, studentId: row.studentId, attDate },
        { $set: { present: !!row.present } },
        { upsert: true }
      );
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Quick mark by studentId
router.post("/attendance/mark", async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { studentId, date, present } = req.body;
    if (!studentId) return res.status(400).json({ error: "Valid studentId required" });
    if (!date)      return res.status(400).json({ error: "date is required (yyyy-mm-dd)" });

    // Find the section this teacher teaches that contains the student
    const sections = await Section.find({ teacherId }).lean();
    const sectionIds = sections.map(s => s._id);

    const enrollment = await Enrollment.find({
      studentId,
      sectionId: { $in: sectionIds },
    }).lean();

    if (!enrollment.length)
      return res.status(404).json({ error: "Student is not in any of your sections." });
    if (enrollment.length > 1)
      return res.status(409).json({
        error: "Student is in multiple sections you teach. Please specify section.",
        sections: enrollment.map(e => String(e.sectionId)),
      });

    const sectionId = enrollment[0].sectionId;
    const attDate   = new Date(date);
    await Attendance.findOneAndUpdate(
      { sectionId, studentId, attDate },
      { $set: { present: !!present } },
      { upsert: true }
    );
    res.json({ ok: true, sectionId });
  } catch (e) { next(e); }
});

// ── Assignments ───────────────────────────────────────────────────────────────
router.post("/assignments", async (req, res, next) => {
  try {
    const { sectionId, title, description, dueDate } = req.body;
    if (!sectionId || !title || !dueDate)
      return res.status(400).json({ error: "sectionId, title, dueDate required" });

    // Verify teacher owns the section
    const section = await Section.findOne({ _id: sectionId, teacherId: req.user.id }).lean();
    if (!section) return res.status(403).json({ error: "You don't own this section" });

    const doc = await Assignment.create({
      sectionId,
      teacherId: req.user.id,
      title: String(title).trim(),
      description: String(description || "").trim(),
      dueDate: new Date(dueDate),
    });
    res.json(doc);
  } catch (e) { next(e); }
});

router.get("/assignments", async (req, res, next) => {
  try {
    const filter = { $or: [{ teacherId: req.user.id }, { createdBy: req.user.id }] };
    if (req.query.sectionId) filter.sectionId = req.query.sectionId;
    const list = await Assignment.find(filter).sort({ createdAt: -1 }).limit(20).lean();
    res.json(list);
  } catch (e) { next(e); }
});

router.get("/assignments/:id/summary", async (req, res, next) => {
  try {
    const a = await Assignment.findById(req.params.id).lean();
    if (!a) return res.status(404).json({ error: "Assignment not found" });
    if (String(a.teacherId) !== String(req.user.id) && String(a.createdBy) !== String(req.user.id))
      return res.status(403).json({ error: "Forbidden" });

    const enrollments = await Enrollment.find({ sectionId: a.sectionId })
      .populate("studentId", "fullName email")
      .lean();

    const subs = await Submission.find({ assignmentId: a._id }).lean();
    const submittedSet = new Set(
      subs.filter(s => s.status === "SUBMITTED").map(s => String(s.studentId))
    );

    const rows = enrollments.map(e => ({
      student_id: String(e.studentId._id),
      full_name:  e.studentId.fullName,
      email:      e.studentId.email,
      submitted:  submittedSet.has(String(e.studentId._id)),
    }));

    res.json({ assignment: a, rows });
  } catch (e) { next(e); }
});

router.post("/assignments/:id/mark", async (req, res, next) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ error: "Assignment not found" });
    if (String(a.teacherId) !== String(req.user.id) && String(a.createdBy) !== String(req.user.id))
      return res.status(403).json({ error: "Forbidden" });

    const { studentId, submitted, url } = req.body;
    if (!studentId) return res.status(400).json({ error: "studentId required" });

    if (submitted) {
      await Submission.findOneAndUpdate(
        { assignmentId: a._id, studentId },
        { $set: { status: "SUBMITTED", url: (url || "").trim(), submittedAt: new Date() } },
        { upsert: true }
      );
    } else {
      await Submission.deleteOne({ assignmentId: a._id, studentId });
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete("/assignments/:id", async (req, res, next) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ error: "Assignment not found" });
    if (String(a.teacherId) !== String(req.user.id))
      return res.status(403).json({ error: "Forbidden" });
    await a.deleteOne();
    await Submission.deleteMany({ assignmentId: a._id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Notices ───────────────────────────────────────────────────────────────────
router.get("/notices", async (_req, res, next) => {
  try {
    const list = await Notice.find({ audience: { $in: ["ALL", "TEACHER", "STUDENT"] } })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (e) { next(e); }
});

export default router;
