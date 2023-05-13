import { RequestHandler, Request } from "express";
import createHttpError from "http-errors";
import { JWTAuthMiddleware, UserRequest } from "../../lib/auth/jwt";
import express from "express";
import ProgressModel from "../progress/model";

const progressRouter = express.Router();

progressRouter.get(
  "/me",
  JWTAuthMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const progress = await ProgressModel.find({
        user_id: req.user._id,
      }).populate("exercise_id", "name");

      res.json(progress);
    } catch (error) {
      next(error);
    }
  }
);

progressRouter.delete(
  "/track/:trackId",
  JWTAuthMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      } else {
        await ProgressModel.findByIdAndDelete({
          _id: req.params.trackId,
        });
        return res.status(202).json({ deleted: "success" });
      }
    } catch (error) {
      next(error);
    }
  }
);

progressRouter.delete(
  "/chart/:exerciseId",
  JWTAuthMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      } else {
        console.log(
          "exercise_id:",
          req.params.exerciseId,
          "user_id:",
          req.user._id
        );
        await ProgressModel.deleteMany({
          user_id: req.user._id,
          exercise_id: req.params.exerciseId,
        });
        return res.status(202).json({ deleted: "success" });
      }
    } catch (error) {
      next(error);
    }
  }
);

export default progressRouter;
