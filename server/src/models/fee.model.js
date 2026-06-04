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

FeeSchema.index({ studentId: 1 });
FeeSchema.index({ status: 1 });
FeeSchema.index({ dueDate: -1 });

export const Fee = mongoose.models.Fee || mongoose.model("Fee", FeeSchema);
