import createHttpError from "http-errors";
import { RequestHandler, Request } from "express";
import { verifyAccessToken, TokenPayload } from "./tools";
export interface UserRequest extends Request {
  user?: TokenPayload;
}

export const JWTAuthMiddleware: RequestHandler = async (
  req: UserRequest,
  res,
  next
) => {
  if (!req.headers.authorization) {
    next(
      createHttpError(
        401,
        "Please provide Bearer token in authorization header"
      )
    );
  } else {
    const accessToken = req.headers.authorization.replace("Bearer ", "");
    try {
      const payload = await verifyAccessToken(accessToken);

      req.user = { _id: payload._id };
      next();
    } catch (error) {
      console.error("Error verifying access token:", error);
      console.error("Token:", accessToken);
      console.log(error);
      next(createHttpError(401, "Token not valid! Please log in again!"));
    }
  }
};
