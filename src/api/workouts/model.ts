import { Schema, model } from "mongoose";

const ExercisesSchema = new Schema({
  gifUrl: { type: String, required: true },
  name: { type: String, required: true },
  target: { type: String, required: true },
  trackExercise: { type: Boolean, required: false, default: false },
  exerciesId: { type: Schema.Types.ObjectId, required: true },
  sets: [
    {
      //   set_id: { type: Schema.Types.ObjectId, required: true },
      repetitions: { type: Number, required: true },
      weight_lifted: { type: Number, required: true },
      _id: { type: String, required: true },
    },
  ],
});

const WorkoutSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workout_name: { type: String, required: true },
    focus: { type: String, required: false },
    likes: { type: [String], required: false, default: [] },
    public: { type: Boolean, required: false, default: false },
    exercises: [ExercisesSchema],
  },
  { timestamps: true }
);

export default model("Workout", WorkoutSchema);
