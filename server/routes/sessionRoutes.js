import { Router } from "express";
import { listRecent } from "../controllers/sessionController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.get("/sessions", requireAuth, listRecent);

export default router;
