import cron from "node-cron";
import Appointment from "../models/appointment.model.js";
import Patient from "../models/patient.model.js";
import { sendEmail } from "../lib/utils/sendMail.js";

cron.schedule("0 9 * * *", async () => {
  try {
    console.log("Running daily appointment reminder job at 9 AM...");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      date: { $gte: tomorrow, $lt: dayAfterTomorrow },
      status: "scheduled",
    }).populate("patientId");

    for (const appointment of appointments) {
      if (!appointment.patientId?.email) continue;

      const patientEmail = appointment.patientId.email;
      const appointmentDate = appointment.date.toLocaleString();

      const message = `
        Hi ${appointment.patientId.name},

        This is a friendly reminder of your appointment scheduled on ${appointmentDate}.

        Please reach out if you need to reschedule.

        Regards,
        HealVerse Team
      `;

      await sendEmail({
        to: patientEmail,
        subject: "Appointment Reminder - HealVerse",
        text: message,
      });

      console.log(
        `Reminder sent to ${patientEmail} for appointment on ${appointmentDate}`
      );
    }
  } catch (error) {
    console.error("Error running appointment reminder job:", error);
  }
});
