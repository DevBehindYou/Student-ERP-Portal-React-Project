import { Router } from "express";
import { auth }       from "../middleware/auth.js";
import { Attendance } from "../models/attendance.model.js";

const router = Router();
router.use(auth);

// GET /api/analytics/attendance/section/:id?from=yyyy-mm-dd&to=yyyy-mm-dd
router.get("/attendance/section/:id", async (req, res, next) => {
  try {
    const sectionId = req.params.id;
    const from = req.query.from ? new Date(req.query.from) : new Date(0);
    const to   = req.query.to   ? new Date(req.query.to)   : new Date();

    const pipeline = [
      {
        $match: {
          sectionId: new (await import("mongoose")).default.Types.ObjectId(sectionId),
          attDate: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$attDate" },
          },
          attendance_rate: { $avg: { $cond: ["$present", 1, 0] } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          attendance_rate: 1,
          total: 1,
        },
      },
    ];

    const rows = await Attendance.aggregate(pipeline);
    res.json(rows);
  } catch (e) { next(e); }
});

export default router;
