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

export default progressRouter;
