import { Router } from "express";
import { auth, allow }  from "../middleware/auth.js";
import { Enrollment }   from "../models/enrollment.model.js";
import { Fee }          from "../models/fee.model.js";
import { Payment }      from "../models/payment.model.js";
import { Assignment }   from "../models/assignment.model.js";
import { Submission }   from "../models/submission.model.js";
import { Notice }       from "../models/notice.model.js";

const router = Router();
router.use(auth, allow("STUDENT"));

// ── Fees ──────────────────────────────────────────────────────────────────────
router.get("/fees", async (req, res, next) => {
  try {
    const fees = await Fee.find({ studentId: req.user.id })
      .sort({ dueDate: -1, createdAt: -1 })
      .lean();
    res.json(fees);
  } catch (e) { next(e); }
});

// POST /api/student/fees/:id/pay
router.post("/fees/:id/pay", async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const feeId     = req.params.id;
    const method    = (req.body.method || "ONLINE").slice(0, 32);
    const txnRef    = (req.body.txnRef || "").slice(0, 64);

    const fee = await Fee.findOne({ _id: feeId, studentId }).lean();
    if (!fee) return res.status(404).json({ error: "Fee not found" });
    if (fee.status !== "DUE") return res.status(409).json({ error: "Fee is not DUE" });

    await Payment.create({ feeId, studentId, amount: fee.amount, method, txnRef: txnRef || null });
    await Fee.findByIdAndUpdate(feeId, { status: "PAID" });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Notices ───────────────────────────────────────────────────────────────────
router.get("/notices", async (_req, res, next) => {
  try {
    const list = await Notice.find({ audience: { $in: ["ALL", "STUDENT"] } })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (e) { next(e); }
});

// ── Assignments ───────────────────────────────────────────────────────────────
router.get("/assignments", async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const enrollments = await Enrollment.find({ studentId }).lean();
    const sectionIds  = enrollments.map(e => e.sectionId);
    if (!sectionIds.length) return res.json([]);

    const assignments = await Assignment.find({ sectionId: { $in: sectionIds } })
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    const subs = await Submission.find({
      assignmentId: { $in: assignments.map(a => a._id) },
      studentId,
    }).lean();

    const subMap = new Map(subs.map(s => [String(s.assignmentId), s]));

    const result = assignments.map(a => {
      const s = subMap.get(String(a._id));
      return {
        _id:         String(a._id),
        sectionId:   a.sectionId,
        title:       a.title,
        description: a.description || "",
        dueDate:     a.dueDate,
        teacherId:   a.teacherId,
        submitted:   !!s,
        submittedAt: s?.submittedAt || null,
        url:         s?.url || "",
      };
    });

    res.json(result);
  } catch (e) { next(e); }
});

// POST /api/student/assignments/:id/submit
router.post("/assignments/:id/submit", async (req, res, next) => {
  try {
    const studentId    = req.user.id;
    const assignmentId = req.params.id;
    const url          = (req.body.url || "").trim();

    if (!url) return res.status(400).json({ error: "Submission URL is required." });

    const a = await Assignment.findById(assignmentId).lean();
    if (!a) return res.status(404).json({ error: "Assignment not found." });

    const enrolled = await Enrollment.findOne({ sectionId: a.sectionId, studentId }).lean();
    if (!enrolled) return res.status(403).json({ error: "Not enrolled for this assignment." });

    await Submission.findOneAndUpdate(
      { assignmentId: a._id, studentId },
      { $set: { status: "SUBMITTED", url, submittedAt: new Date() } },
      { upsert: true }
    );

    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
