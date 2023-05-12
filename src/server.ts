import express from "express";
import passport from "passport";
import cors from "cors";
import googleStrategy from "./lib/auth/google.Oauth";
import userRouter from "./api/users";
import exerciseRouter from "./api/exercises";
import workoutRouter from "./api/workouts";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";
import progressRouter from "./api/progress";

import {
  badRequestHandler,
  forbiddenHandler,
  genericErrorHandler,
  notFoundHandler,
  unauthorizedHandler,
} from "./errorsHandlers";

const server = express();
const port = process.env.PORT;
passport.use("google", googleStrategy);

// *************************** MIDDLEWARES *************************
const whitelist = [process.env.FE_DEV_URL as string, process.env.FE_PROD_URL];
server.use(
  cors({
    origin: (currentOrigin, corsNext) => {
      if (!currentOrigin || whitelist.indexOf(currentOrigin) !== -1) {
        corsNext(null, true);
      } else {
        corsNext(
          createHttpError(
            400,
            `Origin ${currentOrigin} is not in the whitelist!`
          )
        );
      }
    },
  })
);
server.use(express.json());
server.use(passport.initialize());

// *************************** ENDPOINTS ***************************
server.use("/users", userRouter);
server.use("/exercises", exerciseRouter);
server.use("/workouts", workoutRouter);
server.use("/progress", progressRouter);

// ************************* ERROR HANDLERS ************************
server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(forbiddenHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

// ************************* DB CONNECTION ************************

mongoose.connect(process.env.MONGO_URL as string);
mongoose.connection.on("connected", () => {
  console.log("✅ Successfully connected to Mongo!");
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(`✅ Server is running on port ${port}`);
  });
});
