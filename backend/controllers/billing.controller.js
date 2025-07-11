import Bill from "../models/billing.model.js";
import Admission from "../models/admission.model.js";
import Patient from "../models/patient.model.js";
import { generateInvoiceNumber } from "../lib/utils/billing.helper.js";

export const getBillByAdmissionId = async (req, res) => {
  const { id: admissionId } = req.params;

  try {
    const admission = await Admission.findById(admissionId);
    if (!admission) {
      return res.status(404).json({ error: "Admission not found" });
    }
    const bill = await Bill.findOne({ admissionId })
      .populate("patientId", "name gender phone age")
      .populate("generatedBy", "name role")
      .populate("items.referenceId");
    if (!bill) {
      return res
        .status(404)
        .json({ error: "Bill not found for this admission" });
    }
    return res.status(200).json({
      message: "Bill fetched successfully",
      bill,
    });
  } catch (error) {
    console.error("getBillByAdmissionId Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getBillsByPatientId = async (req, res) => {
  const { id: patientId } = req.params;
  try {
    const patient = await Patient.findById(patientId).select(
      "name gender phone"
    );
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    const bills = await Bill.find({ patientId })
      .populate("admissionId", "admitDate dischargeDate status")
      .populate("generatedBy", "name role")
      .populate("items.referenceId");
    if (bills.length === 0) {
      return res.status(404).json({ error: "No bills found for this patient" });
    }
    return res.status(200).json({
      message: "Bills fetched successfully",
      patient,
      bills,
    });
  } catch (error) {
    console.error("getBillsByPatientId Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const finalizeTheBill = async (req, res) => {
  const { id: billId } = req.params;
  try {
    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    if (["finalized", "paid"].includes(bill.status)) {
      return res.status(400).json({
        error: `Cannot finalize a bill that is already ${bill.status}`,
      });
    }
    bill.status = "finalized";
    if (!bill.invoiceNumber) {
      const invoiceNumber = await generateInvoiceNumber();
      bill.invoiceNumber = invoiceNumber;
    }

    await bill.save();
    res.status(200).json({ message: "Bill finalized successfully", bill });
  } catch (error) {
    console.error("finalizeTheBill Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const markBillAsPaid = async (req, res) => {
  const { id: billId } = req.params;
  const { paidAmount, paymentMethod } = req.body;

  try {
    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    if (bill.status === "paid") {
      return res.status(400).json({ error: "Bill is already fully paid" });
    }

    const newPaidAmount = bill.paidAmount + Number(paidAmount);

    if (newPaidAmount > bill.totalAmount) {
      return res
        .status(400)
        .json({ error: "Paid amount exceeds total bill amount" });
    }

    bill.paidAmount = newPaidAmount;
    bill.paymentMethod = paymentMethod || bill.paymentMethod;

    bill.status = newPaidAmount >= bill.totalAmount ? "paid" : "finalized";

    await bill.save();

    return res.status(200).json({
      message: `Bill updated. Status: ${bill.status}`,
      bill,
    });
  } catch (error) {
    console.error("markBillAsPaid Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
