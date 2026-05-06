
import { Router } from "express";
import { generateTest, saveTest, getTeacherTests, getTestById } from "./tests.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { internalOnly } from "../../middleware/internal.js";



const router = Router();

router.post("/generate", authenticate, generateTest);
router.post("/save", authenticate, saveTest);
router.get("/my-tests", authenticate, getTeacherTests);



router.get("/internal/:testId", internalOnly, getTestById);

export default router;