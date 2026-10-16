import {
  Certificate,
  GradeRecord,
  SemesterRecord,
  SchoolConfig,
  User,
  StudentProfile,
} from "../models";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { computeSemesterGPA, computeClassRanking } from "./semester.service";

/**
 * Generate a unique certificate number.
 */
const generateCertificateNumber = (): string => {
  const prefix = "CERT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Check if a student is eligible for a specific certificate type.
 */
export const checkEligibility = async (
  studentId: string,
  academicTermId: string,
  type: string,
): Promise<{
  eligible: boolean;
  reason: string;
  metadata: Record<string, any>;
}> => {
  const { gpa, totalPercentage, subjectCount } = await computeSemesterGPA(
    studentId,
    academicTermId,
  );

  if (subjectCount === 0) {
    return {
      eligible: false,
      reason: "No grades found for this term",
      metadata: {},
    };
  }

  // Check all subjects passed
  const grades = await GradeRecord.find({
    studentId,
    academicTermId,
    isPublished: true,
  });
  const failedSubjects = grades.filter((g) => g.passFail === "fail");

  switch (type) {
    case "completion":
      // Must pass all subjects
      if (failedSubjects.length > 0) {
        return {
          eligible: false,
          reason: `Failed ${failedSubjects.length} subject(s)`,
          metadata: { failedCount: failedSubjects.length },
        };
      }
      return {
        eligible: true,
        reason: "Passed all subjects",
        metadata: { gpa, totalPercentage },
      };

    case "merit":
      // Must have GPA >= 3.0 and no failures
      if (failedSubjects.length > 0 || gpa < 3.0) {
        return {
          eligible: false,
          reason: `GPA ${gpa} < 3.0 or has failures`,
          metadata: { gpa, failedCount: failedSubjects.length },
        };
      }
      return {
        eligible: true,
        reason: `GPA ${gpa} qualifies for merit`,
        metadata: { gpa, totalPercentage },
      };

    case "excellence":
      // Must have GPA >= 3.7 and no failures
      if (failedSubjects.length > 0 || gpa < 3.7) {
        return {
          eligible: false,
          reason: `GPA ${gpa} < 3.7 or has failures`,
          metadata: { gpa, failedCount: failedSubjects.length },
        };
      }
      return {
        eligible: true,
        reason: `GPA ${gpa} qualifies for excellence`,
        metadata: { gpa, totalPercentage },
      };

    case "participation":
      // Always eligible if has grades
      return {
        eligible: true,
        reason: "Has participated in coursework",
        metadata: { gpa, totalPercentage },
      };

    default:
      return {
        eligible: false,
        reason: "Unknown certificate type",
        metadata: {},
      };
  }
};

/**
 * Generate a certificate for a student.
 */
export const generateCertificate = async (params: {
  studentId: string;
  type: "completion" | "merit" | "participation" | "excellence";
  academicTermId: string;
  classId: string;
  issuedBy: string;
}) => {
  const { studentId, type, academicTermId, classId, issuedBy } = params;

  // Check eligibility
  const eligibility = await checkEligibility(studentId, academicTermId, type);
  if (!eligibility.eligible) {
    throw new BadRequestError(
      `Not eligible: ${eligibility.reason}`,
    );
  }

  // Check if certificate already exists
  const existing = await Certificate.findOne({
    studentId,
    academicTermId,
    type,
    status: { $ne: "revoked" },
  });
  if (existing) {
    throw new BadRequestError("Certificate already exists for this student, term, and type");
  }

  // Get ranking info
  const rankings = await computeClassRanking(classId, academicTermId);
  const studentRanking = rankings.find((r) => r.studentId === studentId);

  const certificate = await Certificate.create({
    studentId,
    type,
    academicTermId,
    classId,
    issuedBy,
    certificateNumber: generateCertificateNumber(),
    status: "issued",
    metadata: {
      gpa: eligibility.metadata.gpa,
      percentage: eligibility.metadata.totalPercentage,
      rank: studentRanking?.rank,
      totalStudents: rankings.length,
      remarks: eligibility.reason,
    },
  });

  return certificate;
};

/**
 * Generate certificate HTML for download/print.
 */
export const generateCertificateHTML = async (certificateId: string): Promise<string> => {
  const cert = await Certificate.findById(certificateId)
    .populate("studentId", "firstName lastName")
    .populate("academicTermId", "name year")
    .populate("classId", "name section")
    .populate("issuedBy", "firstName lastName");

  if (!cert) throw new NotFoundError("Certificate not found");

  const student = cert.studentId as any;
  const term = cert.academicTermId as any;
  const cls = cert.classId as any;
  const issuer = cert.issuedBy as any;

  const school = await SchoolConfig.findOne();
  const schoolName = school?.name || "School Management System";
  const schoolAddress = school?.address || "";
  const principalName = school?.principalName || issuer ? `${issuer.firstName} ${issuer.lastName}` : "Principal";

  const typeLabels: Record<string, string> = {
    completion: "Certificate of Completion",
    merit: "Certificate of Merit",
    participation: "Certificate of Participation",
    excellence: "Certificate of Excellence",
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${typeLabels[cert.type] || "Certificate"}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
    .certificate { width: 900px; min-height: 650px; background: white; border: 3px solid #1a365d; padding: 20px; position: relative; }
    .certificate-inner { border: 2px solid #c9a84c; padding: 40px 50px; min-height: 606px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; }
    .header { text-align: center; }
    .school-name { font-family: 'Playfair Display', serif; font-size: 28px; color: #1a365d; font-weight: 700; margin-bottom: 5px; }
    .school-address { font-size: 12px; color: #666; margin-bottom: 20px; }
    .cert-type { font-family: 'Playfair Display', serif; font-size: 36px; color: #c9a84c; text-transform: uppercase; letter-spacing: 3px; margin: 10px 0; }
    .awarded-to { font-size: 14px; color: #666; margin-top: 20px; }
    .student-name { font-family: 'Playfair Display', serif; font-size: 32px; color: #1a365d; margin: 10px 0; border-bottom: 2px solid #c9a84c; padding-bottom: 5px; }
    .details { text-align: center; font-size: 14px; color: #444; line-height: 1.8; }
    .details strong { color: #1a365d; }
    .footer { display: flex; justify-content: space-between; width: 100%; margin-top: 30px; }
    .signature { text-align: center; min-width: 200px; }
    .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; font-size: 12px; color: #666; }
    .cert-number { font-size: 10px; color: #999; margin-top: 15px; }
    @media print { body { background: white; } .certificate { border: none; } }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="certificate-inner">
      <div class="header">
        <div class="school-name">${schoolName}</div>
        <div class="school-address">${schoolAddress}</div>
        <div class="cert-type">${typeLabels[cert.type] || "Certificate"}</div>
      </div>
      <div>
        <div class="awarded-to">This certificate is proudly awarded to</div>
        <div class="student-name">${student.firstName} ${student.lastName}</div>
        <div class="details">
          <p>For outstanding achievement in <strong>${cls.name}${cls.section ? " - " + cls.section : ""}</strong></p>
          <p>Academic Term: <strong>${term.name} ${term.year}</strong></p>
          ${cert.metadata.gpa ? `<p>GPA: <strong>${cert.metadata.gpa}</strong> | Percentage: <strong>${cert.metadata.percentage}%</strong></p>` : ""}
          ${cert.metadata.rank ? `<p>Rank: <strong>${cert.metadata.rank}</strong> out of <strong>${cert.metadata.totalStudents}</strong> students</p>` : ""}
        </div>
      </div>
      <div class="footer">
        <div class="signature">
          <div class="signature-line">Date: ${new Date(cert.issuedDate).toLocaleDateString()}</div>
        </div>
        <div class="signature">
          <div class="signature-line">${principalName}<br/>Principal</div>
        </div>
      </div>
      <div class="cert-number">Certificate No: ${cert.certificateNumber}</div>
    </div>
  </div>
</body>
</html>`;
};
