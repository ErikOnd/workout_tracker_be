import express from "express";
import { JWTAuthMiddleware } from "../../lib/auth/jwt";
import ExerciseModel from "./model";
const exerciseRouter = express.Router();
import createHttpError from "http-errors";

exerciseRouter.get("/all", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const exercises = await ExerciseModel.find();
    res.send(exercises);
  } catch (error) {
    next(error);
  }
});

exerciseRouter.get("/:exercise", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const exercise = await ExerciseModel.findOne({
      name: req.params.exercise,
    });
    if (exercise) {
      console.log(exercise);
      res.send(exercise);
    } else {
      res.send(
        createHttpError(
          404,
          "Couldn't find User with id: " + req.params.exercise
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

export default exerciseRouter;
