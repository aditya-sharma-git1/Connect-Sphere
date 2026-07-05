import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
    {
        meetingCode: { type: String, required: true, index: true },
        sender: { type: String, required: true },
        data: { type: String, required: true },
        socketId: { type: String },
        date: { type: Date, default: Date.now, required: true }
    }
)

const Message = mongoose.model("Message", messageSchema);

export { Message };
