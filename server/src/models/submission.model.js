import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    studentId: { type: Number, required: true },  // users.id (STUDENT)
    url: { type: String, default: "" },
    status: { type: String, enum: ["SUBMITTED", "MISSING"], default: "SUBMITTED" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const Submission =
  mongoose.models.Submission || mongoose.model("Submission", SubmissionSchema);
