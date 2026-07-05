import { Router } from "express";
import { addToHistory, getUserHistory, login, register } from "../controllers/user.controller.js";
import { getLiveKitToken } from "../controllers/livekit.controller.js";
import { startRecording, stopRecording } from "../controllers/recording.controller.js";



const router = Router();

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getUserHistory)
router.route("/get_livekit_token").post(getLiveKitToken)

export default router;
export const livekitRouter = Router();
livekitRouter.route("/start_recording").post(startRecording)
livekitRouter.route("/stop_recording").post(stopRecording)