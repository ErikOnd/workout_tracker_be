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
    try {
      const workoutData = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!workoutData.user_id) {
        workoutData.user_id = req.user._id;
      }

      if (workoutData._id) {
        //workout is not a new workout it's an imported one
        //removeing likes etc.
        delete workoutData._id;
        delete workoutData.createdAt;
        delete workoutData.updatedAt;
        workoutData.likes = [];
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

workoutRouter.get(
  "/me/names",
  JWTAuthMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      console.log("/me/names", req.user._id);

      const workouts = await WorkoutModel.find({
        user_id: req.user._id,
      }).select("workout_name _id");
      console.log(workouts);
      res.json(workouts);
    } catch (error) {
      next(error);
    }
  }
);

// Endpoint to get the number of workouts a user has
workoutRouter.get(
  "/me/count",
  JWTAuthMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const count = await WorkoutModel.countDocuments({
        user_id: req.user._id,
      });
      res.json({ count });
    } catch (error) {
      next(error);
    }
  }
);

// Endpoint to count the total number of likes across all workouts of a user
workoutRouter.get(
  "/me/likes/count",
  JWTAuthMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const workouts = await WorkoutModel.find({ user_id: req.user._id });
      let totalLikes = 0;

      workouts.forEach((workout) => {
        if (workout.likes) {
          totalLikes += workout.likes.length;
        }
      });
      res.json({ totalLikes });
    } catch (error) {
      next(error);
    }
  }
);

workoutRouter.get("/public", async (req, res, next) => {
  try {
    const publicWorkouts = await WorkoutModel.find({
      public: true,
    })
      .sort({ likes: -1 })
      .limit(10)
      .populate("user_id", "username");

    res.json(publicWorkouts);
  } catch (error) {
    next(error);
  }
});

workoutRouter.get("/:workoutId", JWTAuthMiddleware, async (req, res, next) => {
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
    res.json(workout);
  } catch (error) {
    next(error);
  }
});

workoutRouter.get("/public/:name", async (req, res, next) => {
  try {
    console.log("Getting public workouts by name");

    const { name } = req.params;

    const publicWorkouts = await WorkoutModel.find({
      public: true,
      workout_name: { $regex: name, $options: "i" },
    })
      .sort({ likes: -1 })
      .populate("user_id", "username");

    res.json(publicWorkouts);
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
