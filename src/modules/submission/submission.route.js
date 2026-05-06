import { Router } from "express";
import { saveSubmission, gradeSubmissionHandler, getSubmissionResult } from "./submission.controller.js";
import { internalOnly } from "../../middleware/internal.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

router.post("/save",            internalOnly,  saveSubmission);
router.post("/grade/:submissionId", authenticate, gradeSubmissionHandler);
router.get("/result/:submissionId", authenticate,  getSubmissionResult);
export default router;