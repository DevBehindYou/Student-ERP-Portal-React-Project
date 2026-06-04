import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema(
  {
    courseId:  { type: mongoose.Schema.Types.ObjectId, ref: "Course",  required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    term:      { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Section = mongoose.models.Section || mongoose.model("Section", SectionSchema);
