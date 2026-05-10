import { Router } from "express";
import { isAuthenticated } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate.middleware";
import {
  submitPaymentSchema,
  getUserEnrolledCoursesSchema,
  getEnrolledCourseDetailsSchema,
  getStudentsByInstructorSchema,
  getInstructorStatsSchema,
  approveRejectSchema,
} from "./enrollment.validation";
import {
  submitPaymentController,
  getPendingEnrollmentsController,
  approveEnrollmentController,
  rejectEnrollmentController,
  getEnrolledCoursesController,
  getEnrolledCourseController,
  checkEnrollmentController,
  getStudentsByInstructorController,
  getInstructorDashboardController,
  getUserToolsController,
} from "./enrollment.controller";
import {
  // ...existing imports...
  submitToolPaymentController,       // ← add
  checkToolEnrollmentController,     // ← add
} from "./enrollment.controller";
const router = Router();

// ── STUDENT: Manual bKash payment submission ──────────────────────────
// Replaces the old Stripe /create-session route
router.post(
  "/submit-payment",
  isAuthenticated,
  validate(submitPaymentSchema),
  submitPaymentController
);

// ── ADMIN: Pending enrollments list ──────────────────────────────────
router.get("/pending", isAuthenticated, getPendingEnrollmentsController);

// ── ADMIN: Approve / Reject ───────────────────────────────────────────
router.patch(
  "/:enrollmentId/approve",
  isAuthenticated,
  validate(approveRejectSchema),
  approveEnrollmentController
);
router.patch(
  "/:enrollmentId/reject",
  isAuthenticated,
  validate(approveRejectSchema),
  rejectEnrollmentController
);

// ── STUDENT: Enrolled courses & details ──────────────────────────────
router.get(
  "/enrolled-courses/:userId",
  isAuthenticated,
  validate(getUserEnrolledCoursesSchema),
  getEnrolledCoursesController
);
router.get(
  "/enrolled/:courseId",
  isAuthenticated,
  validate(getEnrolledCourseDetailsSchema),
  getEnrolledCourseController
);
router.get(
  "/check-enrollment/:courseId",
  isAuthenticated,
  validate(getEnrolledCourseDetailsSchema),
  checkEnrollmentController
);

// ── INSTRUCTOR: Dashboard & Students ─────────────────────────────────
router.get(
  "/instructor-dashboard/:instructorId",
  isAuthenticated,
  validate(getInstructorStatsSchema),
  getInstructorDashboardController
);
router.get(
  "/students/:instructorId",
  isAuthenticated,
  validate(getStudentsByInstructorSchema),
  getStudentsByInstructorController
);
router.get("/my-tools", isAuthenticated, getUserToolsController)
router.post("/submit-tool-payment", isAuthenticated, submitToolPaymentController);
router.get("/check-tool-enrollment/:toolId", isAuthenticated, checkToolEnrollmentController);
export default router;