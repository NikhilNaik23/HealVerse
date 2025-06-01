import mongoose from "mongoose";
const billingSchema = new mongoose.Schema(
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
    },
    items: {
      type: [
        {
          service: {
            type: String,
            required: true,
          },
          cost: {
            type: Number,
            required: true,
          },
        },
      ],
      validate: [
        (arr) => arr.length > 0,
        "At least one billing item is required",
      ],
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi"],
      default: "cash",
    },
    status: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
    },
  },
  { timestamps: true }
);

billingSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce((acc, item) => acc + item.cost, 0);
  if (this.paidAmount >= this.totalAmount) {
    this.status = "paid";
  } else {
    this.status = "pending";
  }
  next();
});

billingSchema.path("paidAmount").validate(function (value) {
  return value <= this.totalAmount;
}, "Paid amount cannot exceed total amount");

const Billing = mongoose.model("Billing", billingSchema);
export default Billing;
