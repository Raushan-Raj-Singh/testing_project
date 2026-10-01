import mongoose from "mongoose";

const RowSchema = new mongoose.Schema(
  {
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

RowSchema.index({ tableId: 1, createdAt: 1 });

export default mongoose.models.Row || mongoose.model("Row", RowSchema);
