import { Request, Response } from "express";
import { Certificate, ParentProfile } from "../models";
import { asyncHandler, ApiResponse, parsePaginationQuery } from "../utils";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";
import { MESSAGES } from "../constants";
import { createAuditLog } from "../middleware/audit.middleware";
import {
  generateCertificate,
  checkEligibility,
  generateCertificateHTML,
} from "../services/certificate.service";

export class CertificateController {
  /** Generate a certificate for a student (admin/teacher). */
  generate = asyncHandler(async (req: Request, res: Response) => {
    const { studentId, type, academicTermId, classId } = req.body;

    if (!studentId || !type || !academicTermId || !classId) {
      throw new BadRequestError(
        "studentId, type, academicTermId, and classId are required",
      );
    }

    const certificate = await generateCertificate({
      studentId,
      type,
      academicTermId,
      classId,
      issuedBy: req.user!._id.toString(),
    });

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "CERTIFICATE_GENERATED",
      entity: "Certificate",
      entityId: certificate._id,
      metadata: { studentId, type },
      ipAddress: req.ip,
    });

    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.CERTIFICATE_GENERATED,
      data: certificate,
    });
  });

  /** Check eligibility for a certificate. */
  checkEligibility = asyncHandler(async (req: Request, res: Response) => {
    const { studentId, academicTermId, type } = req.query;
    if (!studentId || !academicTermId || !type) {
      throw new BadRequestError(
        "studentId, academicTermId, and type query parameters are required",
      );
    }

    const result = await checkEligibility(
      studentId as string,
      academicTermId as string,
      type as string,
    );

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Eligibility"),
      data: result,
    });
  });

  /** Get certificates for a student. Respects ownership. */
  getStudentCertificates = asyncHandler(
    async (req: Request, res: Response) => {
      const studentId = req.params.studentId;
      const user = req.user!;

      // Ownership checks
      if (user.role === "student" && user._id.toString() !== studentId) {
        throw new ForbiddenError(MESSAGES.FORBIDDEN);
      }
      if (user.role === "parent") {
        const parentProfile = await ParentProfile.findOne({
          userId: user._id,
        });
        if (
          !parentProfile ||
          !parentProfile.childrenIds.map(String).includes(studentId)
        ) {
          throw new ForbiddenError(MESSAGES.FORBIDDEN);
        }
      }

      const certificates = await Certificate.find({
        studentId,
        status: { $ne: "revoked" },
      })
        .populate("academicTermId", "name year")
        .populate("classId", "name section")
        .populate("issuedBy", "firstName lastName")
        .sort({ issuedDate: -1 });

      ApiResponse.success(res, {
        message: MESSAGES.FETCHED("Certificates"),
        data: certificates,
      });
    },
  );

  /** Get a single certificate. */
  getCertificate = asyncHandler(async (req: Request, res: Response) => {
    const cert = await Certificate.findById(req.params.id)
      .populate("studentId", "firstName lastName")
      .populate("academicTermId", "name year")
      .populate("classId", "name section")
      .populate("issuedBy", "firstName lastName");

    if (!cert) throw new NotFoundError(MESSAGES.NOT_FOUND("Certificate"));

    // Ownership check
    if (req.user!.role === "student") {
      if (cert.studentId.toString() !== req.user!._id.toString()) {
        throw new ForbiddenError(MESSAGES.FORBIDDEN);
      }
    }

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Certificate"),
      data: cert,
    });
  });

  /** Download certificate as HTML. */
  downloadCertificate = asyncHandler(async (req: Request, res: Response) => {
    const html = await generateCertificateHTML(req.params.id);
    res.setHeader("Content-Type", "text/html");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="certificate-${req.params.id}.html"`,
    );
    res.send(html);
  });

  /** Get all certificates (admin). */
  getAllCertificates = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const filter: any = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.academicTermId)
      filter.academicTermId = req.query.academicTermId;

    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
        .populate("studentId", "firstName lastName")
        .populate("academicTermId", "name year")
        .populate("classId", "name section")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Certificate.countDocuments(filter),
    ]);

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Certificates"),
      data: certificates,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });
}

export const certificateController = new CertificateController();
