import { Schema, model } from "mongoose";

const ProgressSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true },
    exercise_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Exercise",
    },
    weight_lifted: { type: Number, required: true },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

export default model("Progress", ProgressSchema);
