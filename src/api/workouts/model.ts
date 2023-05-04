import { Schema, model } from "mongoose";

const ExercisesSchema = new Schema({
  exercise_id: { type: Schema.Types.ObjectId, ref: "Exercise", required: true },
  sets: [
    {
      repetitions: { type: Number, required: true },
      weight_lifted: { type: Number, required: true },
    },
  ],
});

const WorkoutSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true },
    workout_name: { type: String, required: true },
    focus: { type: String, required: false },
    likes: { type: Number, required: false },
    exercises: [ExercisesSchema],
  },
  { timestamps: true }
);

export default model("Workout", WorkoutSchema);
