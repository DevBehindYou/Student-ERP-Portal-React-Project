import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema(
  {
    sectionId: { type: Number, required: true },        // MySQL sections.id
    teacherId: { type: Number, required: true },        // users.id (TEACHER)
    title:      { type: String, required: true },
    description:{ type: String, default: "" },
    dueDate:    { type: Date, required: true },
  },
  { timestamps: true }
);

export const Assignment = mongoose.models.Assignment
  || mongoose.model("Assignment", AssignmentSchema);

