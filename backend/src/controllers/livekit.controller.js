import { AccessToken } from "livekit-server-sdk";
import httpStatus from "http-status";

// Mints a short-lived LiveKit access token so the browser never sees the
// LIVEKIT_API_SECRET. The frontend calls this right before connecting to
// a room, then hands the token to livekit-client.
const getLiveKitToken = async (req, res) => {
    const { room, identity } = req.body;

    if (!room || !identity) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "room and identity are required" });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "LiveKit is not configured on the server (missing LIVEKIT_API_KEY/LIVEKIT_API_SECRET)" });
    }

    try {
        const at = new AccessToken(apiKey, apiSecret, {
            identity: identity,
            ttl: "10m", // just needs to last long enough for the client to connect
        });

        at.addGrant({
            room: room,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true, // lets us use LiveKit data channels for chat later if wanted
        });

        const token = await at.toJwt();

        return res.status(httpStatus.OK).json({ token, url: process.env.LIVEKIT_URL });
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Could not create LiveKit token: ${e}` });
    }
};

export { getLiveKitToken };
