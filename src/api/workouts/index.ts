import { RequestHandler, Request } from "express";
import createHttpError from "http-errors";
import ExerciseModel from "./model";
import { JWTAuthMiddleware, UserRequest } from "../../lib/auth/jwt";
import express from "express";
import ProgressModel from "../progress/model";

const workoutRouter = express.Router();

workoutRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const newExercise = new ExerciseModel(req.body);
    const savedExercise = await newExercise.save();

    await Promise.all(
      savedExercise.exercises.map(async (exercise) => {
        if (exercise.trackExercise) {
          if (exercise.sets.length > 0) {
            let weightAdded: number[] = [];

            exercise.sets.map((set) => {
              const calcAmount = set.weight_lifted * (1 + set.repetitions / 30);
              weightAdded.push(calcAmount);
            });

            const oneRapMax = Math.max(...weightAdded).toFixed(2);
            const newProgress = new ProgressModel({
              user_id: savedExercise.user_id,
              exercise_id: exercise.exerciesId,
              weight_lifted: oneRapMax,
            });
            await newProgress.save();
          }
        }
      })
    );

    res.status(201).json(savedExercise);
  } catch (error) {
    next(error);
  }
});

export default workoutRouter;
workoutRouter.get(
  "/me",
  JWTAuthMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const workouts = await ExerciseModel.find({
        user_id: req.user._id,
      });
      res.json(workouts);
    } catch (error) {
      next(error);
    }
  }
);

workoutRouter.get("/:workoutId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const workout = await ExerciseModel.findById(req.params.workoutId);
    if (!workout) {
      return res.send(
        createHttpError(
          404,
          `Workout with id: ${req.params.workoutId} not found`
        )
      );
    }
    res.json(workout);
  } catch (error) {
    next(error);
  }
});

workoutRouter.put("/:workoutId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const updatedWorkout = await ExerciseModel.findByIdAndUpdate(
      req.params.workoutId,
      req.body,
      { new: true }
    );

    if (!updatedWorkout) {
      return res.send(
        createHttpError(
          404,
          `Workout with id: ${req.params.workoutId} not found`
        )
      );
    }
    await Promise.all(
      updatedWorkout.exercises.map(async (exercise) => {
        if (exercise.trackExercise) {
          if (exercise.sets.length > 0) {
            let weightAdded: number[] = [];

            exercise.sets.map((set) => {
              const calcAmount = set.weight_lifted * (1 + set.repetitions / 30);
              weightAdded.push(calcAmount);
            });

            const oneRapMax = Math.max(...weightAdded).toFixed(2);
            const newProgress = new ProgressModel({
              user_id: updatedWorkout.user_id,
              exercise_id: exercise.exerciesId,
              weight_lifted: oneRapMax,
            });
            await newProgress.save();
          }
        }
      })
    );

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

workoutRouter.delete(
  "/:workoutId",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const workoutToDelete = await ExerciseModel.findByIdAndDelete(
        req.params.workoutId
      );

      if (!workoutToDelete) {
        res.send(
          createHttpError(
            404,
            `Workout with id: ${req.params.workoutId} not found`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);
