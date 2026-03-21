import express from "express";
import { userController } from "../controllers/userController.ts";

const router = express.Router();

router.post("/register", userController.register);
router.post("/resend-code", userController.resendCode);
router.post("/verify-email", userController.verifyEmail);
router.post("/login", userController.login);
router.get("/pending-officers", userController.getPendingOfficers);
router.post("/approve-officer", userController.approveOfficer);

export default router;
