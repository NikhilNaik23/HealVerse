import Bill from "../../models/billing.model.js";

import Admission from "../../models/admission.model.js";

export const createBillIfNotExists = async (admissionId, generatedBy) => {
  let bill = await Bill.findOne({ admissionId });
  if (bill) return bill;

  const admission = await Admission.findById(admissionId).populate("patientId");
  if (!admission) {
    throw new Error("Admission not found");
  }

  bill = await Bill.create({
    admissionId,
    patientId: admission.patientId,
    generatedBy,
    items: [],
  });

  return bill;
};

export const addBillingItemToAdmissionBill = async (admissionId, item) => {
  const bill = await Bill.findOne({ admissionId });
  if (!bill) throw new Error("Bill not found");

  if (bill.status !== "open") {
    throw new Error("Cannot modify a finalized or paid bill");
  }

  const isDuplicate = bill.items.some(
    (existing) =>
      existing.referenceId.toString() === item.referenceId.toString() &&
      existing.service === item.service
  );

  if (isDuplicate) {
    throw new Error(`Billing item for this ${item.service} already exists`);
  }

  bill.items.push(item);
  bill.totalAmount = bill.items.reduce((sum, i) => sum + i.cost, 0);
  bill.status = bill.paidAmount >= bill.totalAmount ? "paid" : "open";
  await bill.save();

  return bill;
};

export const generateInvoiceNumber = async () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const datePrefix = `${yyyy}${mm}${dd}`;

  const countToday = await Bill.countDocuments({
    createdAt: {
      $gte: new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`),
      $lte: new Date(`${yyyy}-${mm}-${dd}T23:59:59.999Z`),
    },
  });

  const sequence = String(countToday + 1).padStart(4, "0");
  return `INV-${datePrefix}-${sequence}`;
};