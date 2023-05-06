import { Schema, model } from "mongoose";

const ProgressSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true },
    exercise_id: { type: Schema.Types.ObjectId, required: true },
    weight_lifted: { type: Number, required: true },
  },
  { timestamps: true }
);

export default model("Progress", ProgressSchema);
