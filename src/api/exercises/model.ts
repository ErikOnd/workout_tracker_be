import { Schema, model } from "mongoose";

const ExerciseSchema = new Schema(
  {
    exercise: { type: String, required: true },
    muscles: { type: [String], required: true },
  },
  { timestamps: true }
);

export default model("Exercise", ExerciseSchema);
