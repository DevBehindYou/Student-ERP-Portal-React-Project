import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    feeId:     { type: mongoose.Schema.Types.ObjectId, ref: "Fee",  required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount:    { type: Number, required: true },
    method:    { type: String, default: "ONLINE" },
    txnRef:    { type: String, default: null },
    paidAt:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Payment =
  mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
