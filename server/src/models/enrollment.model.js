import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ studentId: 1, sectionId: 1 }, { unique: true });

export const Enrollment =
  mongoose.models.Enrollment || mongoose.model("Enrollment", EnrollmentSchema);
