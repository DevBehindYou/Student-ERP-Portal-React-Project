import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    code:    { type: String, required: true, unique: true, uppercase: true, trim: true },
    title:   { type: String, required: true, trim: true },
    credits: { type: Number, default: 4 },
  },
  { timestamps: true }
);

export const Course = mongoose.models.Course || mongoose.model("Course", CourseSchema);
