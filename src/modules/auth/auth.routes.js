import { Router } from "express";
import { register, login , getMe } from "./auth.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

// Public — no token needed
router.post("/register", register);

// Protected — Firebase token required
router.post("/login", authenticate, login);

router.get("/me", authenticate, getMe);

export default router;