import mongoose, { Schema } from "mongoose";

const analyticsSchema = new Schema(
  {
    page: { type: String, required: true },
    views: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

analyticsSchema.index({ page: 1, date: 1 });

export default mongoose.models.Analytics || mongoose.model("Analytics", analyticsSchema);
