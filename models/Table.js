import mongoose from "mongoose";

const ColumnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        "text",
        "longText",
        "number",
        "date",
        "datetime",
        "dropdown",
        "checkbox",
        "phone",
      ],
      default: "text",
    },
    options: { type: [String], default: [] },
    special: {
      type: String,
      enum: ["normal", "followup", "priority", "status"],
      default: "normal",
    },
  },
  { _id: false }
);

const TableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: "Lead Management" },
    columns: { type: [ColumnSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Table || mongoose.model("Table", TableSchema);
