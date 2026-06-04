import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema(
  {
    sectionId:   { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueDate:     { type: Date, required: true },
  },
  { timestamps: true }
);

AssignmentSchema.index({ sectionId: 1 });
AssignmentSchema.index({ teacherId: 1 });

export const Assignment = mongoose.models.Assignment
  || mongoose.model("Assignment", AssignmentSchema);
