import { EgressClient, EncodedFileType } from "livekit-server-sdk";
import httpStatus from "http-status";

// Tracks the active egress ID per room so "stop" knows what to stop.
// In-memory is fine for a single backend instance; move to Redis/DB if
// you ever run multiple backend replicas.
const activeEgressByRoom = {};

const getEgressClient = () => {
    const url = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!url || !apiKey || !apiSecret) return null;
    return new EgressClient(url, apiKey, apiSecret);
}

// Starts a "room composite" recording — LiveKit renders a single video of
// the whole room (like a virtual camera watching the call) and uploads
// the result to the S3-compatible bucket configured below.
//
// REQUIRES: an S3 (or GCS/Azure) bucket, since LiveKit needs somewhere to
// put the resulting file. See PHASE4_FEATURES.md for the env vars needed.
const startRecording = async (req, res) => {
    const { room } = req.body;
    if (!room) return res.status(httpStatus.BAD_REQUEST).json({ message: "room is required" });

    const egressClient = getEgressClient();
    if (!egressClient) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "LiveKit is not configured on the server" });
    }

    if (!process.env.RECORDING_S3_BUCKET) {
        return res.status(httpStatus.NOT_IMPLEMENTED).json({
            message: "Recording storage isn't configured yet. Set RECORDING_S3_* env vars — see PHASE4_FEATURES.md"
        });
    }

    try {
        const info = await egressClient.startRoomCompositeEgress(
            room,
            {
                file: {
                    fileType: EncodedFileType.MP4,
                    filepath: `recordings/${room}-${Date.now()}.mp4`,
                    s3: {
                        accessKey: process.env.RECORDING_S3_ACCESS_KEY,
                        secret: process.env.RECORDING_S3_SECRET,
                        bucket: process.env.RECORDING_S3_BUCKET,
                        region: process.env.RECORDING_S3_REGION,
                        endpoint: process.env.RECORDING_S3_ENDPOINT || undefined,
                    }
                }
            },
            { layout: "grid" }
        );

        activeEgressByRoom[room] = info.egressId;
        return res.status(httpStatus.OK).json({ egressId: info.egressId });
    } catch (e) {
        console.log("Failed to start recording:", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Could not start recording: ${e}` });
    }
};

const stopRecording = async (req, res) => {
    const { room } = req.body;
    if (!room) return res.status(httpStatus.BAD_REQUEST).json({ message: "room is required" });

    const egressClient = getEgressClient();
    if (!egressClient) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "LiveKit is not configured on the server" });
    }

    const egressId = activeEgressByRoom[room];
    if (!egressId) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "No active recording found for this room" });
    }

    try {
        await egressClient.stopEgress(egressId);
        delete activeEgressByRoom[room];
        return res.status(httpStatus.OK).json({ message: "Recording stopped" });
    } catch (e) {
        console.log("Failed to stop recording:", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Could not stop recording: ${e}` });
    }
};

export { startRecording, stopRecording };
