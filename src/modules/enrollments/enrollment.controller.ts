import { Request, Response } from "express";
import { catchAsync } from "../../middlewares/catchAsync";
import { AuthRequest } from "../../middlewares/auth";
import {
  submitManualPayment,
  approveEnrollment,
  rejectEnrollment,
  getPendingEnrollments,
  getEnrolledCoursesByUser,
  getEnrolledCourseDetails,
  checkEnrollmentStatus,
  getStudentsByInstructor,
  getInstructorDashboardData,
  getUserTools,
  submitToolPayment,
  checkToolEnrollmentStatus,
} from "./enrollment.service";
import { getUserId, getUserRole } from "../../utils/common";
import { sendSuccess, sendError } from "../../utils/response";


// ─────────────────────────────────────────────
// STUDENT: Submit bKash manual payment
// POST /enrollments/submit-payment
// Body: { courseId, transactionId, couponCode? }
// ─────────────────────────────────────────────

export const getUserToolsController = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req)
  const result = await getUserTools(userId)
  if (!result.success) return sendError(res, result.message || "Failed", 500, result.errors)
  return sendSuccess(res, result.data, "User tools retrieved")
})


export const submitPaymentController = catchAsync(async (req: AuthRequest, res: Response) => {
  const { courseId, transactionId, couponCode } = req.body;
  const studentId = getUserId(req);

  if (!transactionId || !transactionId.trim()) {
    return sendError(res, "Transaction ID or mobile number is required.", 400);
  }

  const result = await submitManualPayment({ studentId, courseId, transactionId, couponCode });

  if (!result.success) {
    return sendError(res, result.message || "Payment submission failed", 400, result.errors);
  }

  return sendSuccess(res, result.data, result.message || "Payment submitted successfully");
});

// ─────────────────────────────────────────────
// ADMIN: Get all pending enrollments
// GET /enrollments/pending
// ─────────────────────────────────────────────
export const getPendingEnrollmentsController = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== "admin") {
      return sendError(res, "Unauthorized. Admin access required.", 403);
    }

    const result = await getPendingEnrollments();
    if (!result.success) {
      return sendError(res, result.message || "Failed to retrieve pending enrollments", 500, result.errors);
    }

    return sendSuccess(res, result.data, "Pending enrollments retrieved successfully");
  }
);

// ─────────────────────────────────────────────
// ADMIN: Approve enrollment
// PATCH /enrollments/:enrollmentId/approve
// Body: { validityDays? }  ← 0 or missing = lifetime
// ─────────────────────────────────────────────
export const approveEnrollmentController = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== "admin") {
      return sendError(res, "Unauthorized. Admin access required.", 403);
    }

    const enrollmentId = req.params.enrollmentId as string;
    const adminId = getUserId(req);
    const { validityDays } = req.body || {};

    const result = await approveEnrollment(enrollmentId, adminId, validityDays);
    if (!result.success) {
      return sendError(res, result.message || "Approval failed", 400, result.errors);
    }

    return sendSuccess(res, result.data, "Enrollment approved successfully");
  }
);

// ─────────────────────────────────────────────
// ADMIN: Reject enrollment
// PATCH /enrollments/:enrollmentId/reject
// Body: { reason? }
// ─────────────────────────────────────────────
export const rejectEnrollmentController = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== "admin") {
      return sendError(res, "Unauthorized. Admin access required.", 403);
    }

    const enrollmentId = req.params.enrollmentId as string;
    const adminId = getUserId(req);
    const { reason } = req.body;

    const result = await rejectEnrollment(enrollmentId, adminId, reason);
    if (!result.success) {
      return sendError(res, result.message || "Rejection failed", 400, result.errors);
    }

    return sendSuccess(res, result.data, "Enrollment rejected");
  }
);

// ─────────────────────────────────────────────
// STUDENT: Get enrolled courses
// GET /enrollments/enrolled-courses/:userId
// ─────────────────────────────────────────────
export const getEnrolledCoursesController = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    if (!userId) return sendError(res, "User ID is required", 400);

    const requestingUserId = getUserId(req);
    const userRole = getUserRole(req);
    if (requestingUserId !== userId && userRole !== "admin") {
      return sendError(res, "Unauthorized to access these courses", 403);
    }

    const result = await getEnrolledCoursesByUser(userId);
    if (!result.success) {
      return sendError(res, result.message || "Failed to retrieve enrolled courses", 500, result.errors);
    }

    return sendSuccess(
      res,
      { ...result.data, count: result.data?.enrolledCourses?.length || 0 },
      "Enrolled courses retrieved successfully"
    );
  }
);

// ─────────────────────────────────────────────
// STUDENT: Get enrolled course content
// GET /enrollments/enrolled/:courseId
// ─────────────────────────────────────────────
export const getEnrolledCourseController = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { courseId } = req.params;
    if (!courseId) return sendError(res, "Course ID is required", 400);

    const userId = getUserId(req);
    const result = await getEnrolledCourseDetails(courseId, userId);

    if (!result.success) {
      const statusCode =
        result.errors?.[0] === "PAYMENT_PENDING" ||
        result.errors?.[0] === "PAYMENT_REJECTED" ||
        result.errors?.[0] === "ENROLLMENT_EXPIRED"
          ? 403
          : 500;
      return sendError(res, result.message || "Failed to retrieve enrolled course", statusCode, result.errors);
    }

    return sendSuccess(res, { course: result.data }, "Enrolled course retrieved successfully");
  }
);

// ─────────────────────────────────────────────
// STUDENT: Check enrollment status
// GET /enrollments/check-enrollment/:courseId
// ─────────────────────────────────────────────
export const checkEnrollmentController = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { courseId } = req.params;
    if (!courseId) return sendError(res, "Course ID is required", 400);

    const userId = getUserId(req);
    const result = await checkEnrollmentStatus(courseId, userId);

    if (!result.success) {
      return sendError(res, result.message || "Failed to check enrollment status", 500, result.errors);
    }

    return sendSuccess(res, result.data, "Enrollment status checked successfully");
  }
);

// ─────────────────────────────────────────────
// INSTRUCTOR: Dashboard
// GET /enrollments/instructor-dashboard/:instructorId
// ─────────────────────────────────────────────
export const getInstructorDashboardController = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { instructorId } = req.params;
    if (!instructorId) return sendError(res, "Instructor ID is required", 400);

    const requestingUserId = getUserId(req);
    const userRole = getUserRole(req);
    if (requestingUserId !== instructorId && userRole !== "admin") {
      return sendError(res, "Unauthorized to access this dashboard", 403);
    }

    const result = await getInstructorDashboardData(instructorId);
    if (!result.success) {
      return sendError(res, result.message || "Failed to retrieve dashboard data", 500, result.errors);
    }

    return sendSuccess(res, result.data, "Dashboard data retrieved successfully");
  }
);

// ─────────────────────────────────────────────
// INSTRUCTOR: Get students
// GET /enrollments/students/:instructorId
// ─────────────────────────────────────────────
export const getStudentsByInstructorController = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { instructorId } = req.params;
    if (!instructorId) return sendError(res, "Instructor ID is required", 400);

    const requestingUserId = getUserId(req);
    const userRole = getUserRole(req);
    if (requestingUserId !== instructorId && userRole !== "admin") {
      return sendError(res, "Unauthorized to access these students", 403);
    }

    const result = await getStudentsByInstructor(instructorId);
    if (!result.success) {
      return sendError(res, result.message || "Failed to retrieve students", 500, result.errors);
    }

    return sendSuccess(res, result.data, "Students retrieved successfully");
  }
);




export const submitToolPaymentController = catchAsync(async (req: AuthRequest, res: Response) => {
  const { toolId, transactionId, variationDays } = req.body;
  const studentId = getUserId(req);
  if (!toolId) return sendError(res, "Tool ID is required.", 400);
  if (!transactionId?.trim()) return sendError(res, "Transaction ID is required.", 400);
  const result = await submitToolPayment({ studentId, toolId, transactionId, variationDays });
  if (!result.success) return sendError(res, result.message || "Failed", 400, result.errors);
  return sendSuccess(res, result.data, result.message || "Payment submitted");
});

export const checkToolEnrollmentController = catchAsync(async (req: AuthRequest, res: Response) => {
  const { toolId } = req.params;
  if (!toolId) return sendError(res, "Tool ID is required.", 400);
  const userId = getUserId(req);
  const result = await checkToolEnrollmentStatus(toolId, userId);
  if (!result.success) return sendError(res, result.message || "Failed", 500, result.errors);
  return sendSuccess(res, result.data, "Tool enrollment status checked");
});