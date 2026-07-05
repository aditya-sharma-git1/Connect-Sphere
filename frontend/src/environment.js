let IS_PROD = true;
const server = IS_PROD ?
    "https://connect-sphere-k99k.onrender.com" :

    "http://localhost:8000"

export const livekitUrl = "wss://connect-sphere-i5olevbr.livekit.cloud"

export default server;