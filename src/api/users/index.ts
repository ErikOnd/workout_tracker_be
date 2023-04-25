import express from "express";
import createHttpError from "http-errors";
import UserModel from "./model";
import passport from "passport";
import { JWTAuthMiddleware } from "../../lib/auth/jwt";
import { createAccessToken } from "../../lib/auth/tools";
import { TokenPayload } from "../../lib/auth/tools";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import { RequestHandler, Request } from "express";
import { JwtPayload } from "jsonwebtoken";

interface googleRequest extends Request {
  user?: { _id?: string; status?: "online" | "offline"; accessToken?: string };
}

interface UserStatus {
  _id: string;
  status: string;
}

const userRouter = express.Router();

userRouter.get(
  "/googleLogin",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "consent",
  })
);

userRouter.get(
  "/googleRedirect",
  passport.authenticate("google", { session: false }),
  (req: googleRequest, res, next) => {
    try {
      res.redirect(
        `${process.env.FE_DEV_URL}/home?accessToken=${req.user?.accessToken}`
      );
    } catch (error) {
      next(error);
    }
  }
);

userRouter.post("/", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body);
    const userList = await UserModel.find();

    const found = userList.find((user) => user.email === req.body.email);
    if (found === undefined) {
      const _id = await newUser.save();
      res.status(201).send({ id: _id });
    } else {
      res.status(400).send("User with that email already exists");
    }
  } catch (error) {
    next(error);
  }
});

userRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.checkCredentials(email, password);
    if (user) {
      const payload: TokenPayload = { _id: user._id };
      const accessToken = await createAccessToken(payload);
      res.send({ accessToken });
    } else {
      next(createHttpError(401, "Credentials are not ok!"));
    }
  } catch (error) {
    next(error);
  }
});

userRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const userList = await UserModel.find();
    res.send(userList);
  } catch (error) {
    next(error);
  }
});

userRouter.get("/me", JWTAuthMiddleware, async (req: JwtPayload, res, next) => {
  try {
    const user = await UserModel.findById(req.user?._id);

    if (user) {
      res.send(user);
    } else {
      res.send(
        createHttpError(404, "Couldn't find User with id: " + req.user?._id)
      );
    }
  } catch (error) {
    next(error);
  }
});

userRouter.put("/me", JWTAuthMiddleware, async (req: JwtPayload, res, next) => {
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user?._id,
      req.body,
      { new: true, runValidators: true }
    );
    res.send(updatedUser);
  } catch (error) {
    next(error);
  }
});

userRouter.get(
  "/:userId",
  JWTAuthMiddleware,
  async (req: JwtPayload, res, next) => {
    try {
      const user = await UserModel.findById(req.params.userId);

      if (user) {
        res.send(user);
      } else {
        res.send(
          createHttpError(
            404,
            "Couldn't find User with id: " + req.params.userId
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "whatsApp/userImg",
    } as any,
  }),
}).single("avatar");

userRouter.put("/image/:userId", cloudinaryUploader, async (req, res, next) => {
  try {
    if (req.file) {
      const updatedUser = await UserModel.findByIdAndUpdate(
        req.params.userId,
        { avatar: req.file.path },
        { new: true, runValidators: true }
      );
      if (updatedUser) {
        res.send(updatedUser);
      } else {
        res.status(404).send("User with that id doesn't exist");
      }
    } else {
      res.status(400).send("No file uploaded");
    }
  } catch (error) {
    next(error);
  }
});

userRouter.delete(
  "/me",
  JWTAuthMiddleware,
  async (req: JwtPayload, res, next) => {
    try {
      await UserModel.findOneAndDelete(req.user._id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default userRouter;
