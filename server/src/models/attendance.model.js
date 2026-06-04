import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    attDate:   { type: Date, required: true },
    present:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

AttendanceSchema.index({ sectionId: 1, studentId: 1, attDate: 1 }, { unique: true });

export const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
