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
  // 1. Check if authorization header is in the request, if it is not --> 401
  if (!req.headers.authorization) {
    next(
      createHttpError(
        401,
        "Please provide Bearer token in authorization header"
      )
    );
  } else {
    // 2. If authorization header is there, we should extract the token out of it
    // Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NDJkMzhhN2ZhN2JlYTgxYmYyZGU2NDgiLCJyb2xlIjoiVXNlciIsImlhdCI6MTY4MDY4NTQ0NiwiZXhwIjoxNjgxMjkwMjQ2fQ.V9rVYh0BrOOwvqeI2YdeCBwEZL4RlEOrQoQ9Mv0Z3Mo"
    const accessToken = req.headers.authorization.replace("Bearer ", "");
    try {
      // 3. Verify the token (check the integrity and check expiration date)
      const payload = await verifyAccessToken(accessToken);

      // 4. If everything is fine we should get back the payload and no errors should be thrown --> next
      req.user = { _id: payload._id };
      next();

      // 5. If the token is NOT ok for any reason, or in any case jsonwebtoken will throw any error --> 401
    } catch (error) {
      console.log(error);
      next(createHttpError(401, "Token not valid! Please log in again!"));
    }
  }
};
