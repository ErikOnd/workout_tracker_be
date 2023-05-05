import { Schema, model } from "mongoose";

const ExerciseSchema = new Schema(
  {
    name: { type: String, required: true },
    bodyPart: { type: String, required: true },
    target: { type: String, required: true },
    equipment: { type: String, required: true },
    gifUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export default model("Exercise", ExerciseSchema);
