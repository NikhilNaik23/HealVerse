import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import Report from "../models/report.model.js";
import Staff from "../models/staff.model.js";
import axios from "axios";

export const createReport = async (req, res) => {
  const { type, patientId, doctorId, notes } = req.body;
  const fileURLs = req.files?.length ? req.files.map((file) => file.path) : [];
  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    if (patient.assignedDoctorId == null) {
      return res
        .status(400)
        .json({ error: "Doctor not assigned to patient yet" });
    }
    if (!patient.assignedDoctorId.equals(doctorId)) {
      return res.status(400).json({ error: "Patient not assigned to Doctor" });
    }
    const doctor = await Doctor.findById(doctorId).populate(
      "staffId",
      "name isActive"
    );
    if (!doctor || !doctor.staffId?.isActive) {
      return res
        .status(400)
        .json({ error: "Doctor is not active or doesn't exist" });
    }

    const report = await Report.create({
      type,
      patientId,
      doctorId,
      fileURLs,
      notes,
      uploadedBy: req.user.auth?._id,
    });
    res.status(201).json({ message: "Report created successfully", report });
    return;
  } catch (error) {
    console.error("createdReport Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllReports = async (req, res) => {
  const { patientId, doctorId, reportDate, uploadedBy } = req.query;
  try {
    const filter = {};
    if (patientId?.trim()) filter.patientId = patientId.trim();
    if (doctorId?.trim()) filter.doctorId = doctorId.trim();
    if (uploadedBy?.trim()) filter.uploadedBy = uploadedBy.trim();
    if (reportDate?.trim()) {
      const dateStart = new Date(reportDate);
      const dateEnd = new Date(reportDate);
      dateEnd.setDate(dateEnd.getDate() + 1);
      filter.reportDate = {
        $gte: dateStart,
        $lt: dateEnd,
      };
    }

    const reports = await Report.find(filter);
    const msg =
      !reports || reports.length === 0
        ? "No reports found"
        : "Reports fetched successfully";

    res
      .status(200)
      .json({ message: msg, reportCount: reports.length, reports });
  } catch (error) {
    console.error("getAllReports Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getReportsByPatientId = async (req, res) => {
  const { id } = req.params;
  const staffId = req.user?.profile;

  try {
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (staff.role === "doctor") {
      if (
        !patient.assignedDoctorId ||
        patient.assignedDoctorId.toString() !== staff._id.toString()
      ) {
        return res.status(403).json({
          error: "Access denied: You are not assigned to this patient",
        });
      }
    }

    if (staff.role === "nurse") {
      if (
        !patient.departmentId ||
        patient.departmentId.toString() !== staff.departmentId?.toString()
      ) {
        return res.status(403).json({
          error: "Access denied: Nurse not assigned to this department",
        });
      }
    }

    const reports = await Report.find({ patientId: id }).populate(
      "doctorId uploadedBy",
      "name role"
    );

    if (reports.length === 0) {
      return res.status(200).json({
        message: "Reports not found for this patient",
        reportCount: 0,
        reports: [],
      });
    }

    return res.status(200).json({
      message: "Reports retrieved successfully",
      reportCount: reports.length,
      reports,
    });
  } catch (error) {
    console.error("getReportsByPatientId Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getReportsOfLoggedInPatient = async (req, res) => {
  const role = req.user?.auth?.role;
  if (role === "Staff") {
    return res
      .status(403)
      .json({ error: "Access denied: Staff cannot access patient reports" });
  }
  const patientId = req.user?.profile;
  try {
    const reports = await Report.find({ patientId: patientId })
      .populate("patientId", "name email")
      .populate({
        path: "doctorId",
        select: "staffId specialization",
        populate: {
          path: "staffId",
          select: "name role departmentId",
        },
      });

    if (reports.length === 0) {
      return res.status(200).json({
        message: "No reports found for this patient",
        reportCount: 0,
        reports: [],
      });
    }

    return res.status(200).json({
      message: "Reports fetched successfully",
      reportCount: reports.length,
      reports,
    });
  } catch (error) {
    console.error("getReportsOfLoggedInPatient Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getReportsOfLoggedInDoctors = async (req, res) => {
  if (req.user?.auth?.role !== "doctor") {
    return res
      .status(403)
      .json({ error: "Access denied: Only doctors can access their reports" });
  }
  const doctorId = req.user?.profile;
  if (!doctorId) {
    return res.status(401).json({ error: "Unauthorized access" });
  }
  try {
    const reports = await Report.find({ doctorId })
      .populate("patientId", "name email")
      .populate("uploadedBy", "name role");
    if (reports.length === 0) {
      return res.status(200).json({
        message: "No reports found for this doctor",
        reportCount: 0,
        reports: [],
      });
    }

    return res.status(200).json({
      message: "Reports fetched successfully",
      reportCount: reports.length,
      reports,
    });
  } catch (error) {
    console.error("getReportsOfLoggedInDoctors Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/* export const downloadReportFile = async (req, res) => {
  const { reportId, fileIndex } = req.params;
  const userId = req.user?.profile;
  const userRole = req.user?.auth?.role;
  const allowedRoles = ["Patient", "doctor", "nurse", "admin"];
if (!allowedRoles.includes(userRole)) {
  return res.status(403).json({ error: "Access denied: Unauthorized role" });
}


  try {
    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ error: "Report not found" });

    const patient = await Patient.findById(report.patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    // Authorization logic
    if (userRole === "Patient") {
      if (patient._id.toString() !== userId.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (userRole === "doctor") {
      if (patient.assignedDoctorId?.toString() !== userId.toString()) {
        return res.status(403).json({ error: "You are not assigned to this patient" });
      }
    } else if (userRole === "nurse") {
      const nurse = await Staff.findById(userId);
      if (nurse.departmentId?.toString() !== patient.departmentId?.toString()) {
        return res.status(403).json({ error: "Access denied: Different department" });
      }
    }

    const index = parseInt(fileIndex);
    if (isNaN(index) || index < 0 || index >= report.fileURLs.length) {
      return res.status(400).json({ error: "Invalid file index" });
    }

    const fileUrl = report.fileURLs[index];

    // Stream file from Cloudinary directly to the client
    const response = await axios({
      method: "get",
      url: fileUrl,
      responseType: "stream",
    });

    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader("Content-Disposition", `attachment; filename=report_${reportId}_${index}.pdf`);
    response.data.pipe(res);
  } catch (error) {
    console.error("downloadReportFile Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
 */