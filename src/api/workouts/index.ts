import { RequestHandler, Request } from "express";
import createHttpError from "http-errors";
import WorkoutModel from "./model";
import { JWTAuthMiddleware, UserRequest } from "../../lib/auth/jwt";
import express from "express";
import ProgressModel from "../progress/model";

const workoutRouter = express.Router();

workoutRouter.post(
  "/",
  JWTAuthMiddleware,
  async (req: UserRequest, res, next) => {
    console.log("i am here");
    try {
      const workoutData = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!workoutData.user_id) {
        workoutData.user_id = req.user._id;
      }

      if (workoutData._id) {
        delete workoutData._id;
        delete workoutData.createdAt;
        delete workoutData.updatedAt;
        workoutData.user_id = req.user._id;
        workoutData.public = false;
      }

      const newExercise = new WorkoutModel(workoutData);
      const savedExercise = await newExercise.save();

      await Promise.all(
        savedExercise.exercises.map(async (exercise) => {
          if (exercise.trackExercise) {
            if (exercise.sets.length > 0) {
              let weightAdded: number[] = [];

              exercise.sets.map((set) => {
                const calcAmount =
                  set.weight_lifted * (1 + set.repetitions / 30);
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
  }
);

workoutRouter.get(
  "/me",
  JWTAuthMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const workouts = await WorkoutModel.find({
        user_id: req.user._id,
      });
      res.json(workouts);
    } catch (error) {
      next(error);
    }
  }
);

workoutRouter.get("/public", async (req, res, next) => {
  try {
    console.log("Getting public workouts");

    const publicWorkouts = await WorkoutModel.aggregate([
      { $match: { public: true } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $addFields: { likesCount: { $size: "$likes" } } },
      { $sort: { likesCount: -1 } },
      { $limit: 10 },
    ]);

    const populatedWorkouts = await WorkoutModel.populate(publicWorkouts, {
      path: "user_id",
      select: "username",
    });

    res.json(populatedWorkouts);
  } catch (error) {
    next(error);
  }
});

workoutRouter.get("/public/:workoutName", async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
});

workoutRouter.put("/:workoutId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const updatedWorkout = await WorkoutModel.findByIdAndUpdate(
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
      const workoutToDelete = await WorkoutModel.findByIdAndDelete(
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

workoutRouter.put(
  "/visibility/:workoutId",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const workout = await WorkoutModel.findById(req.params.workoutId);

      if (!workout) {
        return res.send(
          createHttpError(
            404,
            `Workout with id: ${req.params.workoutId} not found`
          )
        );
      }

      workout.public = !workout.public; // Toggle the value of the "public" field

      const updatedWorkout = await WorkoutModel.findByIdAndUpdate(
        req.params.workoutId,
        { $set: { public: workout.public } },
        { new: true }
      );

      res.json(updatedWorkout);
    } catch (error) {
      next(error);
    }
  }
);

workoutRouter.put(
  "/like/:workoutId",
  JWTAuthMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const workout = await WorkoutModel.findById(req.params.workoutId);

      if (!workout) {
        return res.send(
          createHttpError(
            404,
            `Workout with id: ${req.params.workoutId} not found`
          )
        );
      }

      const userId = req.user._id;

      if (workout.likes && userId) {
        const likedIndex = workout.likes.indexOf(userId);
        if (likedIndex === -1) {
          workout.likes.push(userId);
        } else {
          workout.likes.splice(likedIndex, 1);
        }
      }

      const updatedWorkout = await workout.save();
      res.json(updatedWorkout);
    } catch (error) {
      next(error);
    }
  }
);

export default workoutRouter;
