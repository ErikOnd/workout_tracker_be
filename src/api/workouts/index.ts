import { RequestHandler, Request } from "express";
import createHttpError from "http-errors";
import ExerciseModel from "./model";
import { JWTAuthMiddleware, UserRequest } from "../../lib/auth/jwt";
import express from "express";

const workoutRouter = express.Router();

workoutRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    console.log(req.body);
    const newExercise = new ExerciseModel(req.body);
    const savedExercise = await newExercise.save();
    res.status(201).json(savedExercise);
  } catch (error) {
    next(error);
  }
});

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
      }).populate("exercises.exercise_id");
      res.json(workouts);
    } catch (error) {
      next(error);
    }
  }
);

export default workoutRouter;
