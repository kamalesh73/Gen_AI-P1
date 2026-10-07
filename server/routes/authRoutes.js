import { Router } from "express";
import { getCurrentUser, logIn, signUp } from "../controllers/authController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.post("/signup", signUp);
router.post("/login", logIn);
router.get("/me", requireAuth, getCurrentUser);

export default router;
