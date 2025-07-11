import mongoose from "mongoose";

const billingItemSchema = new mongoose.Schema({
  service: {
    type: String,
    required: true,
    enum: ["admission", "treatment", "prescription", "report", "surgery"],
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  description: String,
  cost: {
    type: Number,
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const billSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
      required: true,
      unique: true,
    },
    items: [billingItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["open", "finalized", "paid"],
      default: "open",
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "insurance"],
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

billSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce((acc, item) => acc + item.cost, 0);
  this.status = this.paidAmount >= this.totalAmount ? "paid" : this.status;
  next();
});

const Bill = mongoose.model("Bill", billSchema);

export default Bill;
