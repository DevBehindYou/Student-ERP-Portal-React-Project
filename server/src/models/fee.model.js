import mongoose from "mongoose";

const FeeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    term:      { type: String, required: true, trim: true },
    amount:    { type: Number, required: true },
    status:    { type: String, enum: ["DUE", "PAID"], default: "DUE" },
    dueDate:   { type: Date, default: null },
  },
  { timestamps: true }
);

export const Fee = mongoose.models.Fee || mongoose.model("Fee", FeeSchema);
