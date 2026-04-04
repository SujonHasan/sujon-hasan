import mongoose, { Schema } from "mongoose";

const seoSchema = new Schema(
  {
    page: { type: String, required: true, unique: true, default: "home" },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    keywords: [{ type: String }],
    ogImage: { type: String, default: "" },
    autoGenerate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Seo || mongoose.model("Seo", seoSchema);
