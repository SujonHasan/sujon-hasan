import mongoose, { Schema } from "mongoose";

const certificationSchema = new Schema(
  {
    title: { type: String, required: true },
    issuer: { type: String, required: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, default: null },
    credentialId: { type: String, default: "" },
    credentialUrl: { type: String, default: "" },
    image: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Certification || mongoose.model("Certification", certificationSchema);
