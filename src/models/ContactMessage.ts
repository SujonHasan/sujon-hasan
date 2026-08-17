import mongoose, { Schema } from "mongoose";

/**
 * A submission from the public contact form. Persisted independently of email
 * delivery so a bad SMTP password never silently loses a lead — `emailStatus`
 * records whether the notification actually went out.
 */
const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    emailStatus: {
      type: String,
      enum: ["sent", "failed", "skipped"],
      default: "skipped",
    },
    emailError: { type: String, default: "" },
    read: { type: Boolean, default: false },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });

export default mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", contactMessageSchema);
