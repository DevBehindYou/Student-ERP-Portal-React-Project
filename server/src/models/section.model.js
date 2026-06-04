import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema(
  {
    courseId:  { type: mongoose.Schema.Types.ObjectId, ref: "Course",  required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    term:      { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

SectionSchema.index({ teacherId: 1 });
SectionSchema.index({ courseId: 1 });

export const Section = mongoose.models.Section || mongoose.model("Section", SectionSchema);
