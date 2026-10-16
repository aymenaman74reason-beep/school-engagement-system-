import mongoose, { Schema } from "mongoose";
import { IMessage } from "../types";

const messageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    threadId: { type: String, index: true },
    subject: { type: String, trim: true },
    content: { type: String, required: true },
    attachments: [{ type: String }],
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ threadId: 1, createdAt: 1 });

messageSchema.pre(/^find/, function (this: any, next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

export const Message = mongoose.model<IMessage>("Message", messageSchema);
